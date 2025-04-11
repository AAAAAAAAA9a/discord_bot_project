const fs = require('fs');
const path = require('path');

class ConfigLoader {
    /**
     * Load a specific configuration file
     * @param {string} configName - Name of the configuration file without extension
     * @returns {object} - The configuration object
     */
    static loadConfig(configName) {
        const configPath = path.join(__dirname, '../../config', `${configName}.json`);
        
        try {
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                return JSON.parse(configData);
            } else {
                console.error(`Configuration file ${configName}.json not found!`);
                return {};
            }
        } catch (error) {
            console.error(`Error loading configuration file ${configName}.json:`, error);
            return {};
        }
    }

    /**
     * Save changes to a configuration file
     * @param {string} configName - Name of the configuration file without extension
     * @param {object} configData - The configuration object to save
     * @returns {boolean} - Success status
     */
    static saveConfig(configName, configData) {
        const configPath = path.join(__dirname, '../../config', `${configName}.json`);
        
        try {
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error saving configuration file ${configName}.json:`, error);
            return false;
        }
    }
}

module.exports = ConfigLoader;
