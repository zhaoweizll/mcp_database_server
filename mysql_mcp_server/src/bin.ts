#!/usr/bin/env node

/**
 * Executable entry point for MySQL MCP Server
 */

import { main } from './server.js';
import { logger } from './utils/logger-util.js';

// 直接启动服务器
main().catch((error) => {
    logger.error(`Server startup failed: ${error}`);
    process.exit(1);
});
