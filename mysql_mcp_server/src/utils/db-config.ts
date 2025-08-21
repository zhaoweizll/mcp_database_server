/**
 * Database Configuration Module
 * 
 * Uses singleton pattern to handle database configuration loading and management.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger, dbConfigPath } from './logger-util.js';

export interface DatabaseInstance {
    dbInstanceId: string;
    dbHost: string;
    dbPort: number;
    dbDatabase: string;
    dbUsername: string;
    dbPassword: string;
    dbType: string;
    dbVersion: string;
    dbActive: boolean;
}

export interface DatabaseInstanceConfig {
    dbPoolSize: number;
    dbMaxOverflow: number;
    dbPoolTimeout: number;
    dbInstancesList: DatabaseInstance[];
    logPath: string;
    logLevel: string;
}

export class DatabaseInstanceConfigLoader {
    private static _instance: DatabaseInstanceConfigLoader | null = null;
    private _initialized = false;
    private configJsonFile: string;
    private _config: DatabaseInstanceConfig | null = null;

    /**
     * Singleton pattern implementation
     */
    static getInstance(): DatabaseInstanceConfigLoader {
        if (!DatabaseInstanceConfigLoader._instance) {
            DatabaseInstanceConfigLoader._instance = new DatabaseInstanceConfigLoader();
        }
        return DatabaseInstanceConfigLoader._instance;
    }

    private constructor() {
        // Initialize configJsonFile before other operations
        this.configJsonFile = dbConfigPath;
        
        if (!this._initialized) {
            this._config = null;
            this._initialized = true;
            logger.debug(`Database instance configuration loader initialized, configuration file: ${this.configJsonFile}`);
        }
    }

    /**
     * Load database configuration from JSON file
     */
    get loadConfig(): DatabaseInstanceConfig {
        if (!fs.existsSync(this.configJsonFile)) {
            const errorMsg = `Configuration file not found: ${this.configJsonFile}`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            const configContent = fs.readFileSync(this.configJsonFile, 'utf-8');
            const configData = JSON.parse(configContent);
            logger.debug(`Successfully read configuration file: ${this.configJsonFile}`);
        
            // Validate required keys
            const requiredKeys = ['dbList'];
            for (const key of requiredKeys) {
                if (!(key in configData)) {
                    const errorMsg = `Missing required configuration key: ${key}`;
                    logger.error(errorMsg);
                    throw new Error(errorMsg);
                }
            }

            // Parse database instances
            const dbInstances: DatabaseInstance[] = [];
            for (const dbData of configData.dbList) {
                const requiredDbKeys = [
                    'dbInstanceId', 'dbHost', 'dbPort', 'dbDatabase',
                    'dbUsername', 'dbPassword', 'dbType', 'dbActive'
                ];
                for (const key of requiredDbKeys) {
                    if (!(key in dbData)) {
                        const errorMsg = `Missing required database configuration key: ${key}`;
                        logger.error(errorMsg);
                        throw new Error(errorMsg);
                    }
                }

                const dbInstance: DatabaseInstance = {
                    dbInstanceId: dbData.dbInstanceId,
                    dbHost: dbData.dbHost,
                    dbPort: dbData.dbPort,
                    dbDatabase: dbData.dbDatabase,
                    dbUsername: dbData.dbUsername,
                    dbPassword: dbData.dbPassword,
                    dbType: dbData.dbType,
                    dbVersion: dbData.dbVersion,
                    dbActive: dbData.dbActive
                };
                dbInstances.push(dbInstance);
                logger.debug(`Parsed database instance: ${dbInstance.dbInstanceId} (${dbInstance.dbHost}:${dbInstance.dbPort})`);
            }

            // Create configuration object
            this._config = {
                dbPoolSize: configData.dbPoolSize,
                dbMaxOverflow: configData.dbMaxOverflow,
                dbPoolTimeout: configData.dbPoolTimeout,
                dbInstancesList: dbInstances,
                logPath: configData.logPath,
                logLevel: configData.logLevel
            };

            logger.debug(`Configuration loading completed, total ${dbInstances.length} database instances`);
            return this._config;

        } catch (error) {
            if (error instanceof SyntaxError) {
                const errorMsg = `Configuration file JSON format error: ${error.message}`;
                logger.error(errorMsg);
                throw new Error(errorMsg);
            }
            throw error;
        }
    }

    /**
     * Get loaded configuration, automatically load if not loaded
     */
    getConfig(): DatabaseInstanceConfig {
        if (this._config === null) {
            return this.loadConfig;
        }
        return this._config;
    }

    /**
     * Get the first active database instance
     */
    getActiveDatabase(): DatabaseInstance | null {
        const config = this.getConfig();
        for (const db of config.dbInstancesList) {
            if (db.dbActive) {
                logger.debug(`Found first active database: ${JSON.stringify(db)}`);
                return db;
            }
        }
        logger.warn("No active database instance found");
        return null;
    }
}

/**
 * Convenience function to load database configuration
 */
export function loadDbConfig(): DatabaseInstanceConfig {
    const loader = DatabaseInstanceConfigLoader.getInstance();
    return loader.loadConfig;
}

/**
 * Convenience function to load database configuration and active database instance
 */
export function loadActivateDbConfig(): [DatabaseInstance, DatabaseInstanceConfig] {
    const loader = DatabaseInstanceConfigLoader.getInstance();
    const config = loader.getConfig();
    const activeDatabase = loader.getActiveDatabase();
    if (activeDatabase === null) {
        throw new Error("No active database instance found");
    }
    return [activeDatabase, config];
}
