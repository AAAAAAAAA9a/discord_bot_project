const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class WarningsSQLiteDB {
    constructor() {
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        this.dbPath = path.join(dataDir, 'warnings.sqlite');
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error connecting to SQLite database:', err);
                return;
            }
            
            console.log('Connected to the SQLite database.');
            this.initializeDatabase();
        });
    }
    
    initializeDatabase() {
        const warningsTable = `
            CREATE TABLE IF NOT EXISTS warnings (
                id TEXT PRIMARY KEY,
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                moderator_id TEXT NOT NULL,
                reason TEXT,
                timestamp INTEGER,
                UNIQUE(id)
            )
        `;
        
        this.db.run(warningsTable, (err) => {
            if (err) {
                console.error('Error creating warnings table:', err);
                return;
            }
            console.log('Warnings table initialized');
            
            this.db.run('CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guild_id, user_id)');
        });
    }
    
    addWarning(guildId, userId, moderatorId, reason, timestamp = Date.now()) {
        return new Promise((resolve, reject) => {
            const warningId = this.generateWarningId(userId);
            
            this.db.run(
                `INSERT INTO warnings (id, guild_id, user_id, moderator_id, reason, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [warningId, guildId, userId, moderatorId, reason, timestamp],
                function(err) {
                    if (err) {
                        console.error('Error adding warning:', err);
                        reject(err);
                        return;
                    }
                    
                    resolve({
                        id: warningId,
                        moderatorId,
                        reason,
                        timestamp
                    });
                }
            );
        });
    }
    
    getWarnings(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY timestamp DESC',
                [guildId, userId],
                (err, rows) => {
                    if (err) {
                        console.error('Error getting warnings:', err);
                        reject(err);
                        return;
                    }
                    
                    resolve(rows);
                }
            );
        });
    }
    
    removeWarning(guildId, userId, warningId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM warnings WHERE id = ? AND guild_id = ?',
                [warningId, guildId],
                function(err) {
                    if (err) {
                        console.error('Error removing warning:', err);
                        reject(err);
                        return;
                    }
                    
                    resolve(this.changes > 0);
                }
            );
        });
    }
    
    clearWarnings(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM warnings WHERE guild_id = ? AND user_id = ?',
                [guildId, userId],
                function(err) {
                    if (err) {
                        console.error('Error clearing warnings:', err);
                        reject(err);
                        return;
                    }
                    
                    resolve(this.changes > 0);
                }
            );
        });
    }
    
    findWarning(warningId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM warnings WHERE id = ?',
                [warningId],
                (err, row) => {
                    if (err) {
                        console.error('Error finding warning:', err);
                        reject(err);
                        return;
                    }
                    
                    resolve(row);
                }
            );
        });
    }
    
    generateWarningId(userId) {
        const timestamp = Date.now();
        const shortUserId = userId.substring(0, 6);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${shortUserId}-${randomStr}`;
    }
    
    getWarningCount(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?',
                [guildId, userId],
                (err, row) => {
                    if (err) {
                        console.error('Error getting warning count:', err);
                        reject(err);
                        return;
                    }
                    
                    resolve(row.count);
                }
            );
        });
    }
    
    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
                return;
            }
            console.log('Database connection closed');
        });
    }
}

module.exports = new WarningsSQLiteDB();
