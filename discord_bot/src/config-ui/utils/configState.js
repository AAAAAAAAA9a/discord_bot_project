/**
 * Utility for managing temporary configuration state
 * Stores user configuration sessions in memory
 */

// In-memory store for configuration sessions
const configSessions = new Map();

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Create a new configuration session for a user
 * @param {string} userId - Discord user ID
 * @returns {Object} The newly created session
 */
function createSession(userId) {
    // Delete any existing session first
    if (configSessions.has(userId)) {
        clearTimeout(configSessions.get(userId).timeoutId);
    }

    // Create a new session with timeout
    const session = {
        data: {},
        timeoutId: setTimeout(() => {
            configSessions.delete(userId);
        }, SESSION_TIMEOUT),
        createdAt: Date.now()
    };

    configSessions.set(userId, session);
    return session;
}

/**
 * Check if a user has an active configuration session
 * @param {string} userId - Discord user ID
 * @returns {boolean} Whether the session exists
 */
function hasSession(userId) {
    return configSessions.has(userId);
}

/**
 * Delete a user's configuration session
 * @param {string} userId - Discord user ID
 */
function deleteSession(userId) {
    if (configSessions.has(userId)) {
        clearTimeout(configSessions.get(userId).timeoutId);
        configSessions.delete(userId);
    }
}

/**
 * Store configuration data in a user's session
 * @param {string} userId - Discord user ID
 * @param {string} key - Data key
 * @param {any} value - Data value
 * @returns {boolean} Success status
 */
function setSessionData(userId, key, value) {
    if (!configSessions.has(userId)) {
        return false;
    }
    
    configSessions.get(userId).data[key] = value;
    return true;
}

/**
 * Get configuration data from a user's session
 * @param {string} userId - Discord user ID
 * @param {string} key - Data key
 * @returns {any} The stored data or undefined
 */
function getSessionData(userId, key) {
    if (!configSessions.has(userId) || !(key in configSessions.get(userId).data)) {
        return undefined;
    }
    
    return configSessions.get(userId).data[key];
}

/**
 * Refresh a user's session timeout
 * @param {string} userId - Discord user ID
 * @returns {boolean} Success status
 */
function refreshSession(userId) {
    if (!configSessions.has(userId)) {
        return false;
    }
    
    const session = configSessions.get(userId);
    clearTimeout(session.timeoutId);
    
    session.timeoutId = setTimeout(() => {
        configSessions.delete(userId);
    }, SESSION_TIMEOUT);
    
    return true;
}

module.exports = {
    createSession,
    hasSession,
    deleteSession,
    setSessionData,
    getSessionData,
    refreshSession
};