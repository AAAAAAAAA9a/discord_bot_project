const fs = require('fs');
const path = require('path');

class WarningsDB {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/warnings.json');
        this.warnings = this.loadWarnings();
    }

    loadWarnings() {
        try {
            // Check if file exists, create it if it doesn't
            if (!fs.existsSync(this.dbPath)) {
                // Create the directory if it doesn't exist
                const dir = path.dirname(this.dbPath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                // Create an empty database
                fs.writeFileSync(this.dbPath, JSON.stringify({}, null, 2), 'utf8');
                return {};
            }
            
            // Read and parse the warnings file
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading warnings database:', error);
            return {};
        }
    }

    saveWarnings() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.warnings, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving warnings database:', error);
            return false;
        }
    }

    addWarning(guildId, userId, moderatorId, reason, timestamp = Date.now()) {
        // Initialize guild if not exists
        if (!this.warnings[guildId]) {
            this.warnings[guildId] = {};
        }
        
        // Initialize user if not exists
        if (!this.warnings[guildId][userId]) {
            this.warnings[guildId][userId] = [];
        }
        
        // Add the warning
        const warning = {
            id: this.generateWarningId(guildId, userId),
            moderatorId,
            reason,
            timestamp
        };
        
        this.warnings[guildId][userId].push(warning);
        return this.saveWarnings() ? warning : null;
    }

    getWarnings(guildId, userId) {
        if (!this.warnings[guildId] || !this.warnings[guildId][userId]) {
            return [];
        }
        
        return this.warnings[guildId][userId];
    }

    removeWarning(guildId, userId, warningId) {
        if (!this.warnings[guildId] || !this.warnings[guildId][userId]) {
            return false;
        }
        
        const initialLength = this.warnings[guildId][userId].length;
        this.warnings[guildId][userId] = this.warnings[guildId][userId].filter(warning => warning.id !== warningId);
        
        // If no warning was removed, return false
        if (initialLength === this.warnings[guildId][userId].length) {
            return false;
        }
        
        // If user has no more warnings, remove the user entry
        if (this.warnings[guildId][userId].length === 0) {
            delete this.warnings[guildId][userId];
            
            // If guild has no more users with warnings, remove the guild entry
            if (Object.keys(this.warnings[guildId]).length === 0) {
                delete this.warnings[guildId];
            }
        }
        
        return this.saveWarnings();
    }

    clearWarnings(guildId, userId) {
        if (!this.warnings[guildId] || !this.warnings[guildId][userId]) {
            return false;
        }
        
        delete this.warnings[guildId][userId];
        
        // If guild has no more users with warnings, remove the guild entry
        if (Object.keys(this.warnings[guildId]).length === 0) {
            delete this.warnings[guildId];
        }
        
        return this.saveWarnings();
    }

    // Generate a unique ID for warnings
    generateWarningId(guildId, userId) {
        // Get current warnings count for this user
        const userWarnings = this.getWarnings(guildId, userId);
        const count = userWarnings.length;
        // Generate a timestamp-based ID
        const timestamp = Date.now();
        return `${timestamp}-${userId.substring(0, 6)}-${count}`;
    }
}

module.exports = new WarningsDB();
