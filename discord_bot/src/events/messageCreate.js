const { Events, PermissionFlagsBits, Collection } = require('discord.js');
const ConfigLoader = require('../utils/configLoader');
const warningsDB = require('../utils/warningsSQLiteDB');
const ModerationUtils = require('../utils/moderationUtils');

// Kolekcja do śledzenia spamu
const spamTracker = new Collection();

// Funkcja sprawdzająca czy wiadomość zawiera zbyt dużo wielkich liter
function checkForCapsLock(content, thresholdPercent) {
    if (content.length < 8) return false; // Ignoruj krótkie wiadomości

    const lettersOnly = content.replace(/[^a-zA-Z]/g, '');
    if (lettersOnly.length < 5) return false; // Ignoruj wiadomości z małą liczbą liter

    const uppercaseLetters = lettersOnly.replace(/[^A-Z]/g, '').length;
    const percentUppercase = (uppercaseLetters / lettersOnly.length) * 100;

    return percentUppercase >= thresholdPercent;
}

// Funkcja sprawdzająca czy wiadomość zawiera zakazane słowa
function containsBannedWords(content, bannedWords) {
    const lowerContent = content.toLowerCase();
    
    for (const word of bannedWords) {
        if (lowerContent.includes(word.toLowerCase())) {
            return true;
        }
    }
    
    return false;
}

// Funkcja do sprawdzania spamu
function checkForSpam(message, config) {
    const now = Date.now();
    const userId = message.author.id;
    
    if (!spamTracker.has(userId)) {
        spamTracker.set(userId, []);
    }
    
    const userMessages = spamTracker.get(userId);
    
    // Dodaj aktualny timestamp
    userMessages.push(now);
    
    // Usuń stare timestampy (starsze niż limit_spam_czas sekund)
    const threshold = now - (config.automod.limit_spam_czas * 1000);
    const recentMessages = userMessages.filter(timestamp => timestamp > threshold);
    
    spamTracker.set(userId, recentMessages);
    
    // Sprawdź czy przekroczono limit wiadomości
    return recentMessages.length > config.automod.limit_spam_wiadomosci;
}

// Funkcja wyciszająca użytkownika
async function muteUser(message, config, reason, duration) {
    try {
        const muteRoleId = config.role_wyciszenia || '123456789012345678'; // ID roli wyciszenia
        const muteRole = message.guild.roles.cache.get(muteRoleId);
        
        if (!muteRole) {
            console.error('Nie znaleziono roli wyciszenia!');
            return false;
        }
        
        await message.member.roles.add(muteRole);
        
        // Wyślij wiadomość o wyciszeniu
        const muteMessage = ModerationUtils.formatMessage(config.wiadomosci.mute, {
            user: message.author.toString(),
            duration: duration,
            reason: reason
        });
        
        const logChannelId = config.kanaly.logi_moderacji;
        if (logChannelId) {
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                await logChannel.send(muteMessage);
            }
        }
        
        // Ustaw czasowe wyciszenie
        setTimeout(async () => {
            try {
                if (message.member && message.member.roles.cache.has(muteRole.id)) {
                    await message.member.roles.remove(muteRole);
                    
                    const unmuteMessage = ModerationUtils.formatMessage(config.wiadomosci.unmute, {
                        user: message.author.toString()
                    });
                    
                    if (logChannelId) {
                        const logChannel = message.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            await logChannel.send(unmuteMessage);
                        }
                    }
                }
            } catch (error) {
                console.error('Błąd podczas zdejmowania wyciszenia:', error);
            }
        }, duration * 1000);
        
        return true;
    } catch (error) {
        console.error('Błąd podczas wyciszania użytkownika:', error);
        return false;
    }
}

// Funkcja dodająca ostrzeżenie
async function addWarning(message, config, reason) {
    try {
        // Dodaj ostrzeżenie do bazy danych
        const warningCount = await warningsDB.addWarning(
            message.guild.id,
            message.author.id,
            'System',
            reason
        );
        
        // Sprawdź czy przekroczono próg ostrzeżeń
        if (warningCount >= config.automod.max_ostrzezenia) {
            try {
                // Ban użytkownika za przekroczenie maksymalnej liczby ostrzeżeń
                await message.member.ban({
                    reason: `Automatyczny ban za przekroczenie ${config.automod.max_ostrzezenia} ostrzeżeń.`
                });
                
                // Wyślij powiadomienie
                const banMessage = ModerationUtils.formatMessage(config.wiadomosci.ban, {
                    user: message.author.toString(),
                    reason: `Przekroczenie ${config.automod.max_ostrzezenia} ostrzeżeń.`
                });
                
                const logChannelId = config.kanaly.logi_moderacji;
                if (logChannelId) {
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send(banMessage);
                    }
                }
            } catch (error) {
                console.error('Błąd podczas banowania użytkownika:', error);
            }
        } else {
            // Sprawdź czy należy wyciszyć użytkownika
            const muteDurations = config.automod.czas_wyciszenia;
            let muteDuration = 0;
            
            switch (warningCount) {
                case 1:
                    muteDuration = muteDurations.pierwsze;
                    break;
                case 2:
                    muteDuration = muteDurations.drugie;
                    break;
                case 3:
                    muteDuration = muteDurations.trzecie;
                    break;
                case 4:
                    muteDuration = muteDurations.czwarte;
                    break;
                case 5:
                    muteDuration = muteDurations.piąte;
                    break;
            }
            
            if (muteDuration > 0) {
                await muteUser(
                    message,
                    config,
                    `Automatyczne wyciszenie za ${warningCount} ostrzeżenie.`,
                    muteDuration
                );
            }
        }
        
        return warningCount;
    } catch (error) {
        console.error('Błąd podczas dodawania ostrzeżenia:', error);
        return 0;
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignoruj wiadomości botów
        if (message.author.bot) return;
        
        // Ignoruj wiadomości spoza serwerów
        if (!message.guild) return;
        
        // Załaduj konfigurację moderacji
        const modConfig = ConfigLoader.loadConfig('moderacja');
        
        // Sprawdź czy automoderacja jest włączona
        if (!modConfig.automod?.wlaczony) return;
        
        // Sprawdź czy kanał jest wyłączony z moderacji
        const excludedChannels = modConfig.automod.wylaczone_kanaly || [];
        if (excludedChannels.includes(message.channel.id)) return;
        
        // Opcjonalne: Ignorowanie administratorów i właściciela serwera
        // Odkomentuj poniższy kod, jeśli chcesz, aby administratorzy i właściciel byli wyłączeni z automoderacji
        /*
        if (
            message.member.permissions.has(PermissionFlagsBits.Administrator) ||
            message.member.id === message.guild.ownerId
        ) {
            return;
        }
        */
        
        // Sprawdzanie treści wiadomości
        const content = message.content;
        
        // 1. Sprawdź zakazane słowa
        if (modConfig.automod.filtrowane_slowa && 
            containsBannedWords(content, modConfig.automod.filtrowane_slowa)) {
            
            // Usuń wiadomość
            try {
                await message.delete();
                
                // Dodaj ostrzeżenie
                await addWarning(message, modConfig, 'Użycie zakazanego słowa');
                
                // Wyślij powiadomienie
                const filterMessage = ModerationUtils.formatMessage(modConfig.wiadomosci.automod_filtr, {
                    user: message.author.toString()
                });
                
                const logChannelId = modConfig.kanaly.logi_moderacji;
                if (logChannelId) {
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send(filterMessage);
                    }
                }
            } catch (error) {
                console.error('Błąd podczas usuwania wiadomości z zakazanym słowem:', error);
            }
            
            return;
        }
        
        // 2. Sprawdź wielkie litery
        if (modConfig.automod.limit_caps_procent && 
            checkForCapsLock(content, modConfig.automod.limit_caps_procent)) {
            
            // Usuń wiadomość
            try {
                await message.delete();
                
                // Dodaj ostrzeżenie
                await addWarning(message, modConfig, 'Nadużycie wielkich liter');
                
                // Wyślij powiadomienie
                const capsMessage = ModerationUtils.formatMessage(modConfig.wiadomosci.automod_caps, {
                    user: message.author.toString()
                });
                
                const logChannelId = modConfig.kanaly.logi_moderacji;
                if (logChannelId) {
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send(capsMessage);
                    }
                }
            } catch (error) {
                console.error('Błąd podczas usuwania wiadomości z nadużyciem wielkich liter:', error);
            }
            
            return;
        }
        
        // 3. Sprawdź spam
        if (checkForSpam(message, modConfig)) {
            try {
                // Wycisz użytkownika za spam
                await muteUser(message, modConfig, 'Spam', 600); // 10 minut wyciszenia
                
                // Wyślij powiadomienie
                const spamMessage = ModerationUtils.formatMessage(modConfig.wiadomosci.automod_spam, {
                    user: message.author.toString()
                });
                
                const logChannelId = modConfig.kanaly.logi_moderacji;
                if (logChannelId) {
                    const logChannel = message.guild.channels.cache.get(logChannelId);
                    if (logChannel) {
                        await logChannel.send(spamMessage);
                    }
                }
            } catch (error) {
                console.error('Błąd podczas wyciszania użytkownika za spam:', error);
            }
        }
    }
};