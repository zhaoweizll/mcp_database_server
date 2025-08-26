/**
 * MySQL MCP Server
 * 
 * A Model Context Protocol (MCP) server for MySQL/MariaDB/TiDB/OceanBase databases.
 */

// Package metadata
export const __version__ = "1.0.2";
export const __author__ = "zhaoweizll";
export const __email__ = "zhaoweizll@foxmail.com";
export const __description__ = "A Model Context Protocol (MCP) server that enables secure interaction with MySQL/MariaDB/TiDB/AWS OceanBase/RDS/Aurora MySQL DataBases.";
export const __license__ = "MIT";
export const __url__ = "https://github.com/zhaoweizll/mcp_database_server";

// Core exports
export * from './utils/index.js';
export { main } from './server.js';

export function getVersion(): string {
    return __version__;
}

export function getPackageInfo(): Record<string, string> {
    return {
        name: "mysql-mcp-server",
        version: __version__,
        author: __author__,
        email: __email__,
        description: __description__,
        license: __license__,
        url: __url__,
    };
}
