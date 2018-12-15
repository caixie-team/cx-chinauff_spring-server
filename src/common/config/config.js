const fs = require('fs')
let PORT = null
const portFile = think.ROOT_PATH + '/PORT'
if (think.isFile(portFile)) {
  PORT = fs.readFileSync(portFile, 'utf8')
}
// default config
module.exports = {
  // http_: 1, // 1:http,2:https
  workers: 1,
  host: '0.0.0.0',
  port: PORT || 8360,
  document_model_type: {2: '主题', 1: '目录', 3: '段落'}, // 文档模型配置 (文档模型核心配置，请勿更改)
  user_administrator: [1] // 数组格式，可以配置多个[1,2,3]
}
