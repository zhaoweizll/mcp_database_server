# MCP Database Server

A Model Context Protocol (MCP) server that enables secure interaction with MySQL/MariaDB/TiDB/AWS OceanBase/RDS/Aurora MySQL databases.

## Features

- **Universal SQL Execution**: Execute any type of SQL statement
- **Connection Pool Management**: Efficient database connection pooling
- **Multiple Database Support**: MySQL, MariaDB, TiDB, OceanBase, RDS, Aurora MySQL
- **MCP Integration**: Full Model Context Protocol support
- **TypeScript**: Written in TypeScript with full type definitions

## Installation

```bash
npm install @zhaoweizll/mysql-mcp-server
```

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zhaoweizll/mcp_database_server.git
   cd mcp_database_server/mysql_mcp_server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure database**:
   ```bash
   cp dbconfig.example.json dbconfig.json
   # Edit dbconfig.json with your database credentials
   ```

4. **Build and run**:
   ```bash
   npm run build
   npm start
   ```
