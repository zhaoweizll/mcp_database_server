import { loadActivateDbConfig } from '../utils/db-config.js';
import { executeSql } from '../utils/db-operate.js';
import { logger } from '../utils/logger-util.js';

export async function generateDatabaseTables(): Promise<{uri: string, mimeType: string, text: string}> {
    try {
        // Get all table names
        const tablesResult = await executeSql("SHOW TABLES");
        const tablesInfo: any[] = [];

        if (Array.isArray(tablesResult)) {
            for (const tableRow of tablesResult) {
                const tableName = Object.values(tableRow)[0] as string; // Get table name

                // Get table structure
                const describeResult = await executeSql(`DESCRIBE ${tableName}`);

                // Get table record count
                const countResult = await executeSql(`SELECT COUNT(*) as count FROM ${tableName}`);
                const recordCount = Array.isArray(countResult) && countResult.length > 0 
                    ? (countResult[0] as any).count 
                    : 0;

                tablesInfo.push({
                    name: tableName,
                    columns: describeResult,
                    record_count: recordCount
                });
            }
        }

        logger.info(`Successfully obtained information for ${tablesInfo.length} tables`);
        return {
            uri: "database://tables",
            mimeType: "application/json",
            text: JSON.stringify(tablesInfo)
        };
    } catch (error) {
        logger.error(`Failed to get database table information: ${error}`);
        return {
            uri: "database://tables",
            mimeType: "application/json",
            text: `Error: ${String(error)}`
        };
    }
}

export async function generateDatabaseConfig(): Promise<any> {
    const [activeDb, dbConfig] = loadActivateDbConfig();

    // Hide sensitive information
    const safeConfig = {
        dbInstanceId: activeDb.dbInstanceId,
        dbHost: activeDb.dbHost,
        dbPort: activeDb.dbPort,
        dbDatabase: activeDb.dbDatabase,
        dbUsername: activeDb.dbUsername,
        dbPassword: "***hidden***",
        dbType: activeDb.dbType,
        dbVersion: activeDb.dbVersion,
        pool_size: dbConfig.dbPoolSize,
        max_overflow: dbConfig.dbMaxOverflow,
        pool_timeout: dbConfig.dbPoolTimeout,
    };
    
    logger.info("Successfully obtained database configuration information");
    logger.info(`Database configuration: ${JSON.stringify(safeConfig)}`);
    return safeConfig;
}
