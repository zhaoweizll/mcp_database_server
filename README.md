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

## Project Structure

```
mcp_database_server/
├── mysql_mcp_server/          # Main TypeScript implementation
│   ├── src/                   # Source code
│   ├── dist/                  # Compiled JavaScript
│   ├── dbconfig.example.json  # Configuration template
│   └── README.md              # Detailed documentation
└── README.md                  # This file
```

## Documentation

See [mysql_mcp_server/README.md](mysql_mcp_server/README.md) for detailed documentation.

## License

MIT License - see [LICENSE](mysql_mcp_server/LICENSE) for details.

## 📋 提交到GitHub的步骤

### 第一步：修复安全问题

```bash
cd /Users/zhaowei/Documents/code/github/mcp_database_server

# 1. 备份当前配置
cp mysql_mcp_server/dbconfig.json mysql_mcp_server/dbconfig.backup.json

# 2. 创建示例配置（手动创建上面的dbconfig.example.json）

# 3. 修复.gitignore（手动添加dbconfig.json到忽略列表）

# 4. 更新根目录README（手动更新内容）
```

### 第二步：检查Git状态

```bash
# 检查当前状态
git status

# 检查是否有未跟踪的敏感文件
git ls-files | grep -E "(password|secret|key|config\.json$)"
```

### 第三步：添加文件并提交

```bash
# 添加所有修改的文件
git add .

# 检查暂存的文件（确保没有敏感信息）
git status

# 提交更改
git commit -m "feat: update to version 1.0.1 with security fixes

- Add bin executable entry point
- Update package configuration
- Add example configuration file
- Fix .gitignore to exclude sensitive dbconfig.json
- Update documentation"
```

### 第四步：推送到GitHub

```bash
# 推送到主分支
git push origin main

# 创建版本标签
git tag v1.0.1
git push origin v1.0.1
```

## ⚠️ 重要安全提醒

1. **绝对不要提交包含真实密码的配置文件**
2. **确保.gitignore正确配置**
3. **使用示例配置文件代替真实配置**
4. **检查Git历史，确保没有敏感信息**

## 🔍 提交前最终检查清单

- [ ] 修复.gitignore文件
- [ ] 创建dbconfig.example.json
- [ ] 更新根目录README.md
- [ ] 确保dbconfig.json不会被提交
- [ ] 检查没有其他敏感信息
- [ ] 验证包结构正确
- [ ] 测试构建成功

修复这些问题后，您的项目就可以安全地提交到GitHub了！🚀
