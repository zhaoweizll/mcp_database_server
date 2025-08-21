/**
 * Database Operations Module
 * 
 * Provides database operation functions with connection pool support.
 */

import { getDbPool } from './db-pool.js';
import { logger } from './logger-util.js';

export async function getPooledConnection() {
    /**
     * Get database connection from connection pool
     */
    try {
        const pool = await getDbPool();
        const conn = await pool.getConnection();
        return conn;
    } catch (error) {
        logger.error(`Failed to get connection from pool: ${error}`);
        throw error;
    }
}

export async function executeSql(sql: string, params?: any[]): Promise<any> {
    /**
     * Execute SQL statement (using connection pool)
     */
    let conn = null;
    try {
        logger.debug("Getting database connection from connection pool...");
        conn = await getPooledConnection();

        // Execute SQL
        logger.debug(`Preparing to execute SQL: ${sql}  params: ${JSON.stringify(params)}`);
        const [rows] = await conn.execute(sql, params || []);

        // Handle different types of SQL statements
        const sqlLower = sql.trim().toLowerCase();
        let result: any;

        if (sqlLower.startsWith('select') || 
            sqlLower.startsWith('show') || 
            sqlLower.startsWith('describe') || 
            sqlLower.startsWith('desc')) {
            result = rows;
            logger.debug(`Query returned ${Array.isArray(result) ? result.length : 0} rows of data`);
        } else if (sqlLower.startsWith('insert') || 
                   sqlLower.startsWith('update') || 
                   sqlLower.startsWith('delete')) {
            // For modification statements, return affected rows count
            result = (rows as any).affectedRows || 0;
            logger.debug(`Query affected ${result} rows of data`);
        } else {
            // For other statements (such as CREATE, DROP, etc.)
            result = "Query executed successfully";
            logger.debug("DDL query executed successfully");
        }

        logger.debug(`SQL executed successfully: result: ${JSON.stringify(result)}`);
        return result;

    } catch (error) {
        logger.error(`SQL execution failed: ${error}`);
        logger.debug(`Failed SQL: ${sql}`);
        throw error;
    } finally {
        if (conn) {
            const pool = await getDbPool();
            await pool.releaseConnection(conn);
            logger.debug("Connection has been released back to pool");
        }
    }
}
