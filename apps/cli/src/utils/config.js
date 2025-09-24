import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';
const DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:3001',
    verbose: false,
    timeout: 10000,
    notifications: {
        email: false,
        slack: false
    },
    thresholds: {
        lowUtilization: 30,
        highUtilization: 90,
        offlineAlert: 5
    }
};
const CONFIG_FILENAME = '.depinautopilot.json';
function getConfigPath() {
    // Check current directory first
    const localPath = join(process.cwd(), CONFIG_FILENAME);
    if (existsSync(localPath)) {
        return localPath;
    }
    // Check home directory
    const homePath = join(homedir(), CONFIG_FILENAME);
    return homePath;
}
export function readConfig() {
    const configPath = getConfigPath();
    try {
        if (!existsSync(configPath)) {
            // Create default config if it doesn't exist
            writeConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
        const configData = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);
        // Merge with defaults to ensure all properties exist
        return {
            ...DEFAULT_CONFIG,
            ...config,
            notifications: {
                ...DEFAULT_CONFIG.notifications,
                ...config.notifications
            },
            thresholds: {
                ...DEFAULT_CONFIG.thresholds,
                ...config.thresholds
            }
        };
    }
    catch (error) {
        console.error(chalk.red(`Error reading config file: ${error instanceof Error ? error.message : error}`));
        console.log(chalk.yellow('Using default configuration...'));
        return DEFAULT_CONFIG;
    }
}
export function writeConfig(config) {
    const configPath = getConfigPath();
    const currentConfig = existsSync(configPath) ? readConfig() : DEFAULT_CONFIG;
    const updatedConfig = {
        ...currentConfig,
        ...config,
        notifications: {
            ...currentConfig.notifications,
            ...config.notifications
        },
        thresholds: {
            ...currentConfig.thresholds,
            ...config.thresholds
        }
    };
    try {
        writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
        console.log(chalk.green(`Configuration saved to ${configPath}`));
    }
    catch (error) {
        console.error(chalk.red(`Error writing config file: ${error instanceof Error ? error.message : error}`));
        throw error;
    }
}
export function validateConfig(config) {
    const errors = [];
    if (config.apiUrl && !isValidUrl(config.apiUrl)) {
        errors.push('Invalid API URL format');
    }
    if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
        errors.push('Timeout must be between 1000 and 60000 milliseconds');
    }
    if (config.thresholds?.lowUtilization && (config.thresholds.lowUtilization < 0 || config.thresholds.lowUtilization > 100)) {
        errors.push('Low utilization threshold must be between 0 and 100');
    }
    if (config.thresholds?.highUtilization && (config.thresholds.highUtilization < 0 || config.thresholds.highUtilization > 100)) {
        errors.push('High utilization threshold must be between 0 and 100');
    }
    if (config.thresholds?.lowUtilization && config.thresholds?.highUtilization) {
        if (config.thresholds.lowUtilization >= config.thresholds.highUtilization) {
            errors.push('Low utilization threshold must be less than high utilization threshold');
        }
    }
    return errors;
}
export function getConfigPath_exported() {
    return getConfigPath();
}
export function configExists() {
    return existsSync(getConfigPath());
}
export function resetConfig() {
    const configPath = getConfigPath();
    try {
        writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
        console.log(chalk.green('Configuration reset to defaults'));
    }
    catch (error) {
        console.error(chalk.red(`Error resetting config: ${error instanceof Error ? error.message : error}`));
        throw error;
    }
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
// Helper function to display current config
export function displayConfig() {
    const config = readConfig();
    const configPath = getConfigPath();
    console.log(chalk.bold.cyan('\nCurrent Configuration:'));
    console.log(chalk.gray(`Config file: ${configPath}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`API URL: ${chalk.yellow(config.apiUrl)}`);
    console.log(`API Key: ${config.apiKey ? chalk.green('Set') : chalk.red('Not set')}`);
    console.log(`Default Owner ID: ${config.defaultOwnerId || chalk.gray('Not set')}`);
    console.log(`Verbose: ${config.verbose ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`Timeout: ${chalk.yellow(config.timeout + 'ms')}`);
    console.log(chalk.bold.cyan('\nNotifications:'));
    console.log(`Email: ${config.notifications?.email ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`Slack: ${config.notifications?.slack ? chalk.green('Enabled') : chalk.red('Disabled')}`);
    console.log(`Webhook URL: ${config.notifications?.webhookUrl || chalk.gray('Not set')}`);
    console.log(chalk.bold.cyan('\nThresholds:'));
    console.log(`Low Utilization: ${chalk.yellow(config.thresholds?.lowUtilization + '%')}`);
    console.log(`High Utilization: ${chalk.yellow(config.thresholds?.highUtilization + '%')}`);
    console.log(`Offline Alert: ${chalk.yellow(config.thresholds?.offlineAlert + ' minutes')}`);
}
