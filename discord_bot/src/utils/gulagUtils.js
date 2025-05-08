const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const ConfigLoader = require('./configLoader');

class GulagUtils {
    static gulagUsersFile = path.join(__dirname, '../../config/gulag_users.json');
    static activeGulagTimers = new Collection();
    
    /**
     * Załaduj dane użytkowników w gulagu
     * @returns {Array} Lista użytkowników w gulagu
     */
    static loadGulagUsers() {
        try {
            if (!fs.existsSync(this.gulagUsersFile)) {
                fs.writeFileSync(this.gulagUsersFile, JSON.stringify({ users: [] }, null, 2));
                return [];
            }
            
            const data = fs.readFileSync(this.gulagUsersFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.users || [];
        } catch (error) {
            console.error('Błąd podczas ładowania danych o użytkownikach w gulagu:', error);
            return [];
        }
    }
    
    /**
     * Zapisz dane użytkowników w gulagu
     * @param {Array} users - Lista użytkowników w gulagu
     */
    static saveGulagUsers(users) {
        try {
            const data = { users };
            fs.writeFileSync(this.gulagUsersFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Błąd podczas zapisywania danych o użytkownikach w gulagu:', error);
        }
    }
    
    /**
     * Dodaj użytkownika do gulagu
     * @param {string} guildId - ID serwera
     * @param {string} userId - ID użytkownika
     * @param {Array} originalRoles - Oryginalne role użytkownika
     * @param {number} duration - Czas trwania kary w sekundach
     * @param {string} reason - Powód wysłania do gulagu
     */
    static addToGulag(guildId, userId, originalRoles, duration, reason) {
        const users = this.loadGulagUsers();
        
        // Usuń użytkownika z listy, jeśli już istnieje
        const filtered = users.filter(user => user.userId !== userId || user.guildId !== guildId);
        
        const endTime = Date.now() + (duration * 1000);
        
        // Dodaj użytkownika z nowym czasem kary
        filtered.push({
            guildId,
            userId,
            originalRoles,
            startTime: Date.now(),
            endTime,
            reason
        });
        
        this.saveGulagUsers(filtered);
        
        // Ustaw timer do automatycznego wypuszczenia
        this.setReleaseTimer(guildId, userId, duration);
        
        return endTime;
    }
    
    /**
     * Usuń użytkownika z gulagu
     * @param {string} guildId - ID serwera
     * @param {string} userId - ID użytkownika
     * @returns {Object|null} Usunięty użytkownik lub null
     */
    static removeFromGulag(guildId, userId) {
        const users = this.loadGulagUsers();
        
        // Znajdź użytkownika
        const userIndex = users.findIndex(user => user.userId === userId && user.guildId === guildId);
        
        if (userIndex === -1) {
            return null;
        }
        
        // Usuń timer, jeśli istnieje
        const timerId = `${guildId}-${userId}`;
        if (this.activeGulagTimers.has(timerId)) {
            clearTimeout(this.activeGulagTimers.get(timerId));
            this.activeGulagTimers.delete(timerId);
        }
        
        // Usuń użytkownika z listy
        const removedUser = users.splice(userIndex, 1)[0];
        this.saveGulagUsers(users);
        
        return removedUser;
    }
    
    /**
     * Sprawdź, czy użytkownik jest w gulagu
     * @param {string} guildId - ID serwera
     * @param {string} userId - ID użytkownika
     * @returns {boolean} Czy użytkownik jest w gulagu
     */
    static isInGulag(guildId, userId) {
        const users = this.loadGulagUsers();
        return users.some(user => user.userId === userId && user.guildId === guildId);
    }
    
    /**
     * Ustaw timer do automatycznego wypuszczenia z gulagu
     * @param {string} guildId - ID serwera
     * @param {string} userId - ID użytkownika
     * @param {number} durationSeconds - Czas trwania kary w sekundach
     */
    static setReleaseTimer(guildId, userId, durationSeconds) {
        const timerId = `${guildId}-${userId}`;
        
        // Usuń istniejący timer, jeśli istnieje
        if (this.activeGulagTimers.has(timerId)) {
            clearTimeout(this.activeGulagTimers.get(timerId));
        }
        
        // Ustaw nowy timer
        const timer = setTimeout(async () => {
            try {
                // Gdy timer się skończy, wykonuj automatyczne wypuszczenie
                const client = require('../index').client;
                const guild = client.guilds.cache.get(guildId);
                
                if (!guild) return;
                
                const member = await guild.members.fetch(userId).catch(() => null);
                if (!member) return;
                
                const config = ConfigLoader.loadConfig('gulag');
                
                // Usuń rolę więźnia
                if (config.role.wiezien) {
                    await member.roles.remove(config.role.wiezien).catch(console.error);
                }
                
                // Przywróć domyślne role
                const userData = this.removeFromGulag(guildId, userId);
                
                // Przywróć weryfikację
                const verificationConfig = ConfigLoader.loadConfig('weryfikacja');
                if (verificationConfig.rola_zweryfikowany) {
                    await member.roles.add(verificationConfig.rola_zweryfikowany).catch(console.error);
                }
                
                // Wyślij powiadomienie
                if (config.kanaly.logi_gulag) {
                    const logChannel = guild.channels.cache.get(config.kanaly.logi_gulag);
                    if (logChannel) {
                        const releaseMessage = config.wiadomosci.uwolniony
                            .replace('{user}', `<@${userId}>`);
                            
                        await logChannel.send(`System: ${releaseMessage} (automatyczne wypuszczenie po upływie czasu kary)`);
                    }
                }
                
                // Wyślij DM do użytkownika
                try {
                    await member.send('Zostałeś automatycznie wypuszczony z gulagu. Twój czas kary upłynął.');
                } catch (error) {
                    // Ignore DM errors
                }
                
            } catch (error) {
                console.error('Błąd podczas automatycznego wypuszczania z gulagu:', error);
            }
        }, durationSeconds * 1000);
        
        // Zapisz timer
        this.activeGulagTimers.set(timerId, timer);
    }
    
    /**
     * Inicjalizuj system gulagu przy starcie bota
     * @param {Client} client - Klient Discord.js
     */
    static initializeGulag(client) {
        const users = this.loadGulagUsers();
        const now = Date.now();
        
        // Przefiltruj wygasłe kary
        const activeUsers = users.filter(user => user.endTime > now);
        
        // Usuń wygasłe kary
        if (activeUsers.length !== users.length) {
            this.saveGulagUsers(activeUsers);
        }
        
        // Ustaw timery dla aktywnych kar
        for (const user of activeUsers) {
            const remainingTime = Math.max(0, user.endTime - now) / 1000;
            this.setReleaseTimer(user.guildId, user.userId, remainingTime);
            
            console.log(`Przywrócono karę dla użytkownika ${user.userId} na serwerze ${user.guildId}. Pozostało ${Math.round(remainingTime)} sekund.`);
        }
        
        console.log(`Zainicjalizowano system gulagu z ${activeUsers.length} aktywnymi karami.`);
    }
    
    /**
     * Formatuj czas trwania z formatu tekstowego na sekundy
     * @param {string} durationStr - Format czasu, np. "1h", "30m", "1d"
     * @param {number} defaultDuration - Domyślny czas w sekundach
     * @returns {number} Czas w sekundach
     */
    static parseDuration(durationStr, defaultDuration = 3600) {
        if (!durationStr || durationStr === 'Indefinite') {
            return defaultDuration;
        }
        
        const regex = /^(\d+)([smhdw])$/;
        const match = durationStr.match(regex);
        
        if (!match) {
            return defaultDuration;
        }
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 60 * 60 * 24;
            case 'w': return value * 60 * 60 * 24 * 7;
            default: return defaultDuration;
        }
    }
    
    /**
     * Formatuj czas w sekundach na przyjazny format
     * @param {number} seconds - Czas w sekundach
     * @returns {string} Sformatowany czas
     */
    static formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} sekund`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)} minut`;
        } else if (seconds < 86400) {
            return `${Math.floor(seconds / 3600)} godzin`;
        } else if (seconds < 604800) {
            return `${Math.floor(seconds / 86400)} dni`;
        } else {
            return `${Math.floor(seconds / 604800)} tygodni`;
        }
    }
}

module.exports = GulagUtils;