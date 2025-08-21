/**
 * Database Connection Pool Management Module
 * Provides MySQL connection pool functionality
 */

import mysql from 'mysql2/promise';
import { logger } from './logger-util.js';
import { loadActivateDbConfig, DatabaseInstance, DatabaseInstanceConfig } from './db-config.js';

export class DatabasePool {
    private static _instance: DatabasePool | null = null;
    private _pool: mysql.Pool | null = null;
    private _config: DatabaseInstanceConfig | null = null;

    /**
     * Get singleton instance
     */
    static async getInstance(): Promise<DatabasePool> {
        if (!DatabasePool._instance) {
            DatabasePool._instance = new DatabasePool();
            await DatabasePool._instance._initialize();
        }
        return DatabasePool._instance;
    }

    private constructor() {}

    /**
     * Initialize connection pool
     */
    private async _initialize(): Promise<void> {
        if (this._pool !== null) {
            return;
        }

        // Get active database instance and configuration
        const [dbInstance, dbConfig] = loadActivateDbConfig();
        this._config = dbConfig;

        try {
            const poolSize = dbConfig.dbPoolSize;
            const maxOverflow = dbConfig.dbMaxOverflow;
            const poolTimeout = dbConfig.dbPoolTimeout;
            const maxSize = poolSize + maxOverflow;

            this._pool = mysql.createPool({
                host: dbInstance.dbHost,
                port: dbInstance.dbPort,
                user: dbInstance.dbUsername,
                password: dbInstance.dbPassword,
                database: dbInstance.dbDatabase,
                connectionLimit: maxSize,
                waitForConnections: true,
                idleTimeout: 300000, // 5 minutes
                queueLimit: 0
            });

            logger.info(`Database connection pool initialized successfully, pool size: ${poolSize}, max size: ${maxSize}, pool timeout: ${poolTimeout}s`);
            logger.info(`Database connection pool Config: ${JSON.stringify(dbInstance)}`);
        } catch (error) {
            logger.error(`Database connection pool initialization failed: ${error}`);
            throw error;
        }
    }

    /**
     * Get database connection
     */
    async getConnection(): Promise<mysql.PoolConnection> {
        if (this._pool === null) {
            await this._initialize();
        }

        try {
            const conn = await this._pool!.getConnection();
            logger.debug("Successfully obtained connection from pool");
            return conn;
        } catch (error) {
            logger.error(`Failed to get connection from pool: ${error}`);
            throw error;
        }
    }

    /**
     * Release database connection back to connection pool
     */
    async releaseConnection(conn: mysql.PoolConnection): Promise<void> {
        if (this._pool === null) {
            logger.warn("Connection pool does not exist, cannot release connection");
            return;
        }

        try {
            conn.release();
            logger.debug("Successfully released connection back to pool");
        } catch (error) {
            logger.error(`Failed to release connection back to pool: ${error}`);
        }
    }

    /**
     * Close connection pool
     */
    async closePool(): Promise<void> {
        if (this._pool === null) {
            logger.warn("Connection pool does not exist, no need to close");
            return;
        }

        try {
            await this._pool.end();
            this._pool = null;
            logger.info("Database connection pool has been closed");
        } catch (error) {
            logger.error(`Failed to close database connection pool: ${error}`);
        }
    }

    /**
     * Execute query directly using pool
     */
    async execute(sql: string, params?: any[]): Promise<any> {
        if (this._pool === null) {
            await this._initialize();
        }

        try {
            const [rows] = await this._pool!.execute(sql, params);
            return rows;
        } catch (error) {
            logger.error(`Failed to execute query: ${error}`);
            throw error;
        }
    }
}

/**
 * Export connection pool getter function
 */
export async function getDbPool(): Promise<DatabasePool> {
    return await DatabasePool.getInstance();
}
