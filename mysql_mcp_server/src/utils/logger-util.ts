/**
 * Logging Utility Module
 * 
 * Unified logging configuration module. All other modules should import logger from here.
 */

import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectPath = path.resolve(__dirname, '..', '..');
const logLevelArray = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

/**
 * Get database configuration file path
 * Priority: Environment variable config_file > Default dbconfig.json
 */
function getDbConfigFile(): string {
    const configFile = process.env.config_file;
    if (configFile && fs.existsSync(configFile)) {
        //console.log(`Get database configuration path from environment variable config_file: ${configFile}`);
        return configFile;
    } else {
        const defaultConfig = path.join(projectPath, "dbconfig.json");
        //console.log(`Using default database configuration path: ${defaultConfig}`);
        return defaultConfig;
    }
}

export const dbConfigPath = getDbConfigFile();

/**
 * Normalize log path to ensure it ends with appropriate log directory suffix
 */
function normalizeLogPath(logPath: string): string {
    if (!logPath) {
        return logPath;
    }
    
    // Check if path ends with log/logs (with or without trailing slash)
    const normalizedPath = logPath.replace(/[/\\]+$/, '');
    return normalizedPath.endsWith('logs') || normalizedPath.endsWith('log') 
        ? logPath 
        : path.join(logPath, "logs");
}

/**
 * Get log path and log level from configuration file
 */
function getLogConfig(): [string, string] {
    const configFile = dbConfigPath;
    try {
        const configContent = fs.readFileSync(configFile, 'utf-8');
        const config = JSON.parse(configContent);
        
        // Get log path
        let logPath = config.logPath;
        if (!logPath || logPath.trim().length === 0) {
            logPath = path.join(projectPath, "logs");
        } else {
            logPath = normalizeLogPath(logPath);
        }

        // Get log level
        let logLevel = config.logLevel;
        if (!logLevel || logLevel.trim().length === 0) {
            logLevel = "info";
        } else {
            logLevel = logLevel.toLowerCase();
            if (!logLevelArray.includes(logLevel)) {
                logLevel = "info";
            }
        }
        
        return [logPath, logLevel];
    } catch (error) {
        // If configuration file doesn't exist or parsing fails, use default values
        return [path.join(projectPath, "logs"), "info"];
    }
}

const [logPath, logLevel] = getLogConfig();
const logFile = path.join(logPath, "mcp_server.log");

/**
 * Configure logging output
 */
function setupLogger(logFile: string, logLevel: string): winston.Logger {
    // Ensure log directory exists
    if (!fs.existsSync(logPath)) {
        fs.mkdirSync(logPath, { recursive: true });
    }

    const logger = winston.createLogger({
        level: logLevel,
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message, stack }) => {
                const caller = new Error().stack?.split('\n')[2]?.trim() || '';
                const callerInfo = caller.replace(/^at\s+/, '');
                return `${timestamp} | ${level.toUpperCase()} | ${callerInfo} | ${stack || message}`;
            })
        ),
        transports: [
            // Output to stderr so MCP can see logs
            new winston.transports.Console({
                level: logLevel,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                ),
                stderrLevels: ['error', 'warn', 'info', 'verbose', 'debug', 'silly']
            }),
            // Also output to file
            new winston.transports.File({
                filename: logFile,
                level: logLevel,
                maxsize: 10485760, // 10MB
                maxFiles: 7,
                tailable: true
            })
        ]
    });

    logger.info(`Logging configuration completed, log level: ${logLevel}, log file path: ${logFile}`);
    return logger;
}

// Initialize logging configuration
export const logger = setupLogger(logFile, logLevel);

export { logPath, logLevel, logFile };
