/**
 * model adapter config
 * @type {Object}
 */
const mysql = require('think-model-mysql')
const isDev = think.env === 'development'
const fileCache = require('think-cache-file');
const path = require('path');

module.exports = {
  type: 'mysql',
  common: {
    charset: 'UTF8MB4',
    logConnect: false,
    logSql: true,
    // logSql: false,
    logger: msg => think.logger.info(msg)
  },
  mysql: {
    logConnect: isDev,
    handle: mysql,
    database: 'spring',
    prefix: 'picker_',
    connectionLimit: 1, // 连接池的连接个数，默认为 1
    // charset: 'UTF8MB4',
    charset: 'UTF8MB4_GENERAL_CI',
    // debug: true,
    host: isDev ? '119.3.87.146' : '192.168.25.147',
    port: isDev ? '3306' : '3306',
    user: 'root',
    password: isDev ? 'Lnjhi%M5py' : 'Lnjhi%M5py',
    dateStrings: true,
    cache: { // 额外的缓存配置
      type: 'file',
      handle: fileCache,
      cachePath: path.join(think.ROOT_PATH, 'runtime/cache') // absoulte path is necessarily required
    }
  }
}
