/**
 * 数据库连接测试脚本
 */

import { executeSql } from '../utils/db-operate.js';
import { logger } from '../utils/logger-util.js';
import { fileURLToPath } from 'url';
import * as path from 'path';

async function testDatabaseConnection() {
    console.log('🚀 开始测试数据库连接...\n');
    
    try {
        // 测试1: 基本连接测试
        console.log('📋 测试1: 检查数据库版本');
        const versionResult = await executeSql('SELECT VERSION() as version');
        console.log('✅ 数据库版本:', versionResult[0]?.version);
        
        // 测试2: 检查当前数据库
        console.log('\n📋 测试2: 检查当前数据库');
        const dbResult = await executeSql('SELECT DATABASE() as current_db');
        console.log('✅ 当前数据库:', dbResult[0]?.current_db);
        
        // 测试3: 检查当前时间
        console.log('\n📋 测试3: 检查数据库时间');
        const timeResult = await executeSql('SELECT NOW() as `current_time`');
        console.log('✅ 数据库时间:', timeResult[0]?.current_time);
        
        // 测试4: 查看所有表
        console.log('\n📋 测试4: 查看数据库中的表');
        const tablesResult = await executeSql('SHOW TABLES');
        if (Array.isArray(tablesResult) && tablesResult.length > 0) {
            console.log('✅ 数据库中的表:');
            tablesResult.forEach((table, index) => {
                const tableName = Object.values(table)[0];
                console.log(`   ${index + 1}. ${tableName}`);
            });
        } else {
            console.log('ℹ️  数据库中暂时没有表');
        }
        
        // 测试5: 检查数据库状态
        console.log('\n📋 测试5: 检查数据库状态');
        const statusResult = await executeSql('SHOW STATUS LIKE "Threads_connected"');
        console.log('✅ 当前连接数:', statusResult[0]?.Value);
        
        console.log('\n🎉 所有测试通过！数据库连接正常！');
        
    } catch (error) {
        console.error('\n❌ 数据库连接测试失败:');
        console.error('错误信息:', error);
        console.log('\n🔧 请检查以下配置:');
        console.log('1. dbconfig.json 中的数据库配置是否正确');
        console.log('2. 数据库服务是否正在运行');
        console.log('3. 网络连接是否正常');
        console.log('4. 用户名和密码是否正确');
        process.exit(1);
    }
}

// 运行测试
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    testDatabaseConnection()
        .then(() => {
            console.log('\n✨ 测试完成，程序退出');
            process.exit(0);
        })
        .catch((error) => {
            console.error('测试过程中发生错误:', error);
            process.exit(1);
        });
}

export { testDatabaseConnection };
