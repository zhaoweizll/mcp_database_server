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
        version: "1.0.1",
    }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "sql_exec",
                description: "Universal SQL execution tool",
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
                description: "Table structure description tool", 
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
                description: "Test data generation tool",
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
                description: "Database table information resource"
            },
            {
                uri: "database://config", 
                mimeType: "application/json",
                name: "Database Configuration",
                description: "Database configuration information resource"
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
