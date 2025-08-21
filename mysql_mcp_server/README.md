# MySQL MCP Server (TypeScript)

A Model Context Protocol (MCP) server that enables secure interaction with MySQL/MariaDB/TiDB/AWS OceanBase/RDS/Aurora MySQL databases. This is the TypeScript version converted from the original Python implementation.

## Features

- **Universal SQL Execution**: Execute any type of SQL statement (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, etc.)
- **Connection Pool Management**: Efficient database connection pooling with configurable parameters
- **Multiple Database Support**: MySQL, MariaDB, TiDB, OceanBase, RDS, Aurora MySQL
- **Resource Discovery**: Automatic database schema and table information discovery
- **Test Data Generation**: Built-in test data generation for development environments
- **Comprehensive Logging**: Detailed logging with configurable levels
- **Security**: Password masking in configuration display

## Installation

```bash
npm install
```

## Configuration

Configure your database connection in `dbconfig.json`:

```json
{
    "dbPoolSize": 5,
    "dbMaxOverflow": 10,
    "dbPoolTimeout": 30,
    "dbList": [
        {
            "dbInstanceId": "mysql_1",
            "dbHost": "localhost",
            "dbPort": 3306,
            "dbDatabase": "your_database",
            "dbUsername": "your_username",
            "dbPassword": "your_password",
            "dbType": "MySQL",
            "dbVersion": "8.0",
            "dbActive": true
        }
    ],
    "logPath": "/path/to/logs",
    "logLevel": "info"
}
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## MCP Tools

### sql_exec
Execute any SQL statement:
```typescript
await sql_exec("SELECT * FROM users WHERE age > 18");
```

### describe_table
Get table structure information:
```typescript
await describe_table("users");
```

### generate_demo_data
Generate test data for development:
```typescript
await generate_demo_data("users", ["name", "email"], 100);
```

## MCP Resources

### database://tables
Get information about all database tables including structure and record counts.

### database://config
Get current database configuration (with masked sensitive information).

## Project Structure

```
src/
├── server.ts              # Main MCP server
├── index.ts               # Package exports
├── utils/
│   ├── logger-util.ts     # Logging configuration
│   ├── db-config.ts       # Database configuration management
│   ├── db-pool.ts         # Connection pool management
│   ├── db-operate.ts      # Database operations
│   └── index.ts           # Utils exports
├── tools/
│   └── db-tool.ts         # Database utility functions
└── resources/
    └── db-resources.ts    # MCP resource handlers
```

## License

MIT
