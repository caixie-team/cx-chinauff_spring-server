const fs = require('fs')
const isDev = think.env === 'development';

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
  user_administrator: [1], // 数组格式，可以配置多个[1,2,3],
  // proxyActivityApi: !isDev ? 'http://crm.chinauff.com/lnj-weixin' : 'http://demo.micvs.com/lnj-weixin/console',
  // proxyCrmApi: !isDev ? 'http://crm.chinauff.com/crm' : 'http://demo.i-manji.com/crmSession'
  proxyActivityApi: 'http://demo.micvs.com/lnj-weixin',
  proxyCrmApi: 'http://demo.i-manji.com/crmSession',
  proxyQueryString: {
    version: '1.0',
    activityToken: 'C5AB4E7A104F2492B9241D5E98C9BF0332785730FAC1056BF8A01DD25EF77171',
    crmToken: '67405076EFC81E6ACA83FB1B7D02898C5CBCC8A464C0EC44C5CA8EEEA62E79FA',
    deviceSeq: '1516345652000',
    // new Date().getTime()
    deviceTime: '',
    merNo: 2109,
    shopNo: '210910030008',
    deviceNo: '21092552',
    // Generate.id()
    orderNo: '',
    channel: 2,
    note: 'chinauff_spring',
    deviceDate:  '2018-09-03 10:03:49',
    transCode: 'C034',
    // 传入
    cardNo: '',
    openId: ''
  }
}
