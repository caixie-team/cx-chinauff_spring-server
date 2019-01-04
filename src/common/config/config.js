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
  wechat: {
    appId: 'wxa8299eb7fc27ef04'
  },
  // 活动 API
  proxyActivityApi: 'http://demo.micvs.com/lnj-weixin',
  // proxyActivityApi: 'http://crm.chinauff.com',
  // CRM API
  proxyCrmApi: 'http://demo.i-manji.com/crmSession',
  // proxyCrmApi: 'http://crm.chinauff.com',
  proxyQueryString: {
    version: '1.0',
    activityToken: 'C5AB4E7A104F2492B9241D5E98C9BF0332785730FAC1056BF8A01DD25EF77171',
    crmToken: '67405076EFC81E6ACA83FB1B7D02898C5CBCC8A464C0EC44C5CA8EEEA62E79FA',
    deviceSeq: '1516345652000',
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
  },
  proxyQueryStringForCoupon: {
    version: '1.0',
    channel: 5,
    deviceDate:  '2018-04-16 11:50:00',
    merNo: 2109,
    deviceNo: '21092552',
    shopNo: '210910030008',
    token: '67405076EFC81E6ACA83FB1B7D02898C5CBCC8A464C0EC44C5CA8EEEA62E79FA',
    deviceSeq: '1516345652000',
    orderNo: '',
    transCode: 'A016',
    // amount: 'oQJYBw_H_E3FRVj1jsHSHG__AmKQ',
    amount: '',
    type: 2,
    couponJson: [{
      couponType: 1228,
      couponNum: 1
    }]
  }
}
