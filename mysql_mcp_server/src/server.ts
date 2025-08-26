/**
 * MCP SQL Server
 * 
 * Main entry point for MySQL/MariaDB/TiDB/AWS OceanBase/RDS/Aurora MySQL DataSource MCP Client server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    CallToolResult,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
    ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { logger, dbConfigPath } from './utils/logger-util.js';
import { executeSql } from './utils/db-operate.js';
import { generateDatabaseTables, generateDatabaseConfig } from './resources/db-resources.js';
import { loadActivateDbConfig } from './utils/index.js';
import { generateTestData } from './tools/db-tool.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectPath = path.resolve(__dirname, '..');

// Create MCP server instance
const server = new Server(
    {
        name: "DataSource MCP Client Server",
        version: "1.0.2",
    }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "sql_exec",
                description: `MySQL/MariaDB/TiDB/Oceanbase SQL execution tool
                
Function description:
Execute any type of SQL statement, including SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, etc.
Supports query and modification operations, automatically handles transaction commit and rollback

Parameter description:
- sql (str): SQL statement to execute, supports parameterized queries

Return value:
- dict: Dictionary containing execution results
    - success (bool): Whether execution was successful
    - result: Execution result (query returns data list, modification returns affected rows)
    - message (str): Execution status description
    - error (str): Error message on failure (only exists when success=False)

Usage examples:
- Query: SELECT * FROM users WHERE age > 18
- Insert: INSERT INTO users (name, age) VALUES ('John', 25)
- Update: UPDATE users SET age = 26 WHERE name = 'John'
- Delete: DELETE FROM users WHERE age < 18`,
                inputSchema: {
                    type: "object",
                    properties: {
                        sql: {
                            type: "string",
                            description: "SQL statement to execute, supports parameterized queries"
                        }
                    },
                    required: ["sql"]
                }
            },
            {
                name: "describe_table",
                description: `MySQL/MariaDB/TiDB/Oceanbase Table structure description tool

Function description:
Get detailed structure information of the specified table, including column names, data types, NULL allowance, default values, key types, etc.
Equivalent to executing DESCRIBE table_name or SHOW COLUMNS FROM table_name

Parameter description:
- table_name (str): Table name to describe, supports database.table format

Return value:
- dict: Same return format as sql_exec tool, result contains table structure information list

Usage examples:
- describe_table("users")
- describe_table("mydb.users")

Return data example:
[
    {"Field": "id", "Type": "int(11)", "Null": "NO", "Key": "PRI", "Default": null, "Extra": "auto_increment"},
    {"Field": "name", "Type": "varchar(100)", "Null": "NO", "Key": "", "Default": null, "Extra": ""}
]`, 
                inputSchema: {
                    type: "object",
                    properties: {
                        table_name: {
                            type: "string",
                            description: "Table name to describe, supports database.table format"
                        }
                    },
                    required: ["table_name"]
                }
            },
            {
                name: "generate_demo_data",
                description: `MySQL/MariaDB/TiDB/Oceanbase Test data generation tool

Function description:
Generate specified amount of test data for specified tables and columns
Automatically generates random strings as test data for development and testing environments

Parameter description:
- table_name (str): Table name to generate test data for
- columns_name (List[str]): List of column names to fill with data
- num (int): Number of test records to generate

Return value:
- dict: Same return format as generate_test_data function
    - success (bool): Whether data generation was successful
    - result: Generation result information
    - error (str): Error message on failure (only exists when success=False)

Data generation rules:
- Each record generates 8-character random letter strings for each column
- Uses INSERT statements for batch data insertion
- Supports any number of columns and data types (string type)

Usage examples:
- generate_demo_data("users", ["name", "email", "phone"], 100)
- generate_demo_data("products", ["product_name", "category"], 50)

Notes:
- Only suitable for development and testing environments
- Generated data consists of random strings, no business logic included
- Large data generation may take considerable time`,
                inputSchema: {
                    type: "object", 
                    properties: {
                        table_name: {
                            type: "string",
                            description: "Table name to generate test data for"
                        },
                        columns_name: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of column names to fill with data"
                        },
                        num: {
                            type: "number",
                            description: "Number of test records to generate"
                        }
                    },
                    required: ["table_name", "columns_name", "num"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "sql_exec": {
                const { sql } = args as { sql: string };
                logger.info(`MCP tool executing SQL: ${sql}`);
                
                try {
                    const result = await executeSql(sql);
                    
                    // Record execution results
                    if (Array.isArray(result)) {
                        logger.info(`SQL execution successful, returned ${result.length} rows of data`);
                    } else {
                        logger.info(`SQL execution successful, affected ${result} rows`);
                    }
                        
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: true,
                                    result: result,
                                    message: "SQL executed successfully"
                                })
                            }
                        ],
                        isError: false
                    };
                } catch (error) {
                    const errorMsg = String(error);
                    logger.error(`MCP tool SQL execution failed: ${errorMsg}`);
                    return {
                        content: [
                            {
                                type: "text", 
                                text: JSON.stringify({
                                    success: false,
                                    error: errorMsg,
                                    message: "SQL execution failed"
                                })
                            }
                        ],
                        isError: true
                    };
                }
            }

            case "describe_table": {
                const { table_name } = args as { table_name: string };
                logger.info(`MCP tool: Describe table structure - ${table_name}`);
                
                try {
                    const result = await executeSql(`DESCRIBE ${table_name};`);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: true,
                                    result: result,
                                    message: "Table described successfully"
                                })
                            }
                        ],
                        isError: false
                    };
                } catch (error) {
                    const errorMsg = String(error);
                    logger.error(`MCP tool describe table failed: ${errorMsg}`);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: false,
                                    error: errorMsg,
                                    message: "Table description failed"
                                })
                            }
                        ],
                        isError: true
                    };
                }
            }

            case "generate_demo_data": {
                const { table_name, columns_name, num } = args as { 
                    table_name: string; 
                    columns_name: string[]; 
                    num: number; 
                };
                logger.info(`MCP tool: Generate test data - ${table_name}`);
                const result = await generateTestData(table_name, columns_name, num);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result)
                        }
                    ],
                    isError: false
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error}`
                }
            ],
            isError: true
        };
    }
});

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "database://tables",
                mimeType: "application/json",
                name: "Database Tables",
                description: `MySQL/MariaDB/TiDB/Oceanbase Database table information resource

Function description:
Provides metadata information for all tables in the database, including table names, table structures, record counts, etc.
This is a read-only resource for obtaining database schema information, not involving data modification operations

Resource URI:
- database://tables - Represents database table collection resource

Return value format:
- uri (str): Resource identifier "database://tables"
- mimeType (str): Content type "application/json"
- text (str): JSON-formatted table information string

Return data content:
Contains detailed information list for all tables, each table includes:
- name: Table name
- columns: Table structure information (column names, data types, constraints, etc.)
- record_count: Number of records in the table

Usage scenarios:
- Database schema analysis
- Table structure viewing
- Data volume statistics
- Database monitoring

Notes:
- This is a read-only resource that will not modify database content
- Returned information is based on current active database connection
- Databases with many tables may require longer response time`
            },
            {
                uri: "database://config", 
                mimeType: "application/json",
                name: "Database Configuration",
                description: `MySQL/MariaDB/TiDB/Oceanbase Database configuration information resource

Function description:
Provides configuration information for current database connection, including connection parameters, connection pool settings, etc.
Sensitive information (such as passwords) will be hidden to ensure configuration information security

Resource URI:
- database://config - Represents database configuration resource

Return value format:
- uri (str): Resource identifier "database://config"
- mimeType (str): Content type "application/json"
- text (str): JSON-formatted configuration information string

Return data content:
Contains configuration information for database instances and connection pools:
- dbInstanceId: Database instance identifier
- dbHost: Database host address
- dbPort: Database port number
- dbDatabase: Database name
- dbUsername: Database username
- dbPassword: "***hidden***" (password is hidden)
- dbType: Database type (xesql/mysql/ubisql)
- dbVersion: Database version
- pool_size: Connection pool size
- max_overflow: Maximum overflow connections
- pool_timeout: Connection pool timeout

Usage scenarios:
- Database connection status check
- Connection pool configuration viewing
- Database type and version information retrieval
- System monitoring and diagnostics

Security features:
- Database passwords are hidden from display
- Only returns configuration for current active database
- Does not expose sensitive information from other database instances

Notes:
- This is a read-only resource that will not modify database configuration
- Configuration information is based on dbconfig.json file
- Environment variable config_file will override default configuration file path`
            }
        ]
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request): Promise<ReadResourceResult> => {
    const { uri } = request.params;

    try {
        switch (uri) {
            case "database://tables": {
                logger.info("Getting database table information");
                const tablesInfo = await generateDatabaseTables();
                
                return {
                    contents: [
                        {
                            uri: tablesInfo.uri,
                            mimeType: tablesInfo.mimeType,
                            text: tablesInfo.text
                        }
                    ]
                };
            }

            case "database://config": {
                logger.info("Getting database configuration information");
                const safeConfig = await generateDatabaseConfig();
                
                return {
                    contents: [
                        {
                            uri: "database://config",
                            mimeType: "application/json", 
                            text: JSON.stringify(safeConfig)
                        }
                    ]
                };
            }

            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error}`);
    }
});

// Main function
export async function main(): Promise<void> {
    logger.info(`Database configuration file path: ${dbConfigPath}`);
    logger.info(`Current project path: ${projectPath}`);
    logger.info("Xesql/Mysql/Ubisql DataSource MCP Client server is ready to accept connections");

    try {
        const [activeDb, dbConfig] = loadActivateDbConfig();
        logger.info(`Current database instance configuration: ${JSON.stringify(activeDb)}`);
    } catch (error) {
        logger.error(`Failed to load database configuration: ${error}`);
        process.exit(1);
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("MCP server connected and ready");
}

// Run server if this is the main module
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    main().catch((error) => {
        logger.error(`Server startup failed: ${error}`);
        process.exit(1);
    });
}
