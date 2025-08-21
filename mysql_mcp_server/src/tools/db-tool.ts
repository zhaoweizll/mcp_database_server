/**
 * Database Utility Functions
 * 
 * Provides database utility functions related to SQL execution.
 */

import { executeSql } from '../utils/db-operate.js';
import { logger } from '../utils/logger-util.js';

export async function sqlExec(sql: string): Promise<{success: boolean, result?: any, error?: string}> {
    /**
     * Execute any SQL statement (SELECT/INSERT/UPDATE/DELETE)
     */
    logger.info(`Executing SQL: ${sql}`);
    try {
        const result = await executeSql(sql);
        logger.info(`SQL executed successfully, returned ${Array.isArray(result) ? result.length : result} rows/affected rows`);
        return { success: true, result: result };
    } catch (error) {
        logger.error(`SQL execution failed: ${error}`);
        return { success: false, error: String(error) };
    }
}

function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function generateTestData(table: string, columns: string[], num: number): Promise<{success: boolean, result?: string, error?: string}> {
    logger.info(`Starting to generate ${num} test records for table '${table}'`);
    logger.debug(`Target table ${table} columns: ${JSON.stringify(columns)}`);

    try {
        for (let i = 0; i < num; i++) {
            const values: string[] = [];
            for (const col of columns) {
                // Simple example: all use 8-character random strings
                const randomValue = generateRandomString(8);
                values.push(randomValue);
            }

            const placeholders = columns.map(() => '?').join(',');
            const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;

            logger.debug(`Inserting row ${i + 1}/${num}: ${JSON.stringify(Object.fromEntries(columns.map((col, idx) => [col, values[idx]])))}}`);
            await executeSql(sql, values);
        }

        logger.info(`Successfully generated ${num} test records for table '${table}'`);
        return { 
            success: true, 
            result: `Successfully generated ${num} test records for table '${table}'` 
        };
    } catch (error) {
        logger.error(`Failed to generate test data: ${error}`);
        return { 
            success: false, 
            error: String(error) 
        };
    }
}
