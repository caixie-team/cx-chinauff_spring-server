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
  // 公网地址：https://weixin.chinauff.com
  // 内网地址：http://192.168.0.136
  // merno=2109
  // shopno=210999999998
  // deviceno=210999999998
  // channel=18
  // token=B0A8DB136921E59A6573A3F732FC754C014361DFC5F5F677894765C28C25A5731DEBCE0DE84B5964
  // 活动 API
  proxyActivityApi: isDev ? 'http://demo.micvs.com/lnj-weixin' : 'http://crm.chinauff.com/lnj-weixin',
  // proxyActivityApi: 'http://crm.chinauff.com/lnj-weixin',
  // CRM API
  proxyCrmApi: isDev ? 'http://demo.i-manji.com/crmSession' : 'http://crm.chinauff.com/crm',
  // proxyCrmApi: 'http://crm.chinauff.com/crm',
  proxyQueryString: {
    version: '1.0',
    activityToken: isDev ? 'C5AB4E7A104F2492B9241D5E98C9BF0332785730FAC1056BF8A01DD25EF77171' : 'B0A8DB136921E59A6573A3F732FC754C014361DFC5F5F677894765C28C25A5731DEBCE0DE84B5964',
    // activityToken: 'C5AB4E7A104F2492B9241D5E98C9BF0332785730FAC1056BF8A01DD25EF77171',
    // crmToken: '67405076EFC81E6ACA83FB1B7D02898C5CBCC8A464C0EC44C5CA8EEEA62E79FA',
    crmToken: isDev ? '67405076EFC81E6ACA83FB1B7D02898C5CBCC8A464C0EC44C5CA8EEEA62E79FA' : 'B0A8DB136921E59A6573A3F732FC754C014361DFC5F5F677894765C28C25A5731DEBCE0DE84B5964',
    deviceSeq: '1516345652000',
    deviceTime: '',
    merNo: 2109,
    // shopNo: '210910030008',
    shopNo: isDev ? '210910030008' : '210999999998',
    deviceNo: isDev ? '21092552' : '210999999998',
    // deviceNo: '21092552',
    // Generate.id()
    orderNo: '',
    channel: 2,
    note: 'chinauff_spring',
    deviceDate: '2018-09-03 10:03:49',
    transCode: 'C034',
    // 传入
    cardNo: '',
    openId: ''
  },
  proxyQueryStringForCoupon: {
    version: '1.0',
    channel: isDev ? 5 : 18,
    deviceDate: '2018-04-16 11:50:00',
    merNo: 2109,
    deviceNo: isDev ? '21092552' : '210999999998',
    // deviceNo: '210999999998',
    shopNo: isDev ? '210910030008' : '210999999998',
    // shopNo: '210999999998',
    // token: 'B0A8DB136921E59A6573A3F732FC754C014361DFC5F5F677894765C28C25A5731DEBCE0DE84B5964',
    token: isDev ? '67405076EFC81E6ACA83FB1B7D02898C5CBCC8A464C0EC44C5CA8EEEA62E79FA' : 'B0A8DB136921E59A6573A3F732FC754C014361DFC5F5F677894765C28C25A5731DEBCE0DE84B5964',
    deviceSeq: '1516345652000',
    orderNo: '',
    transCode: 'A016',
    // amount: 'oQJYBw_H_E3FRVj1jsHSHG__AmKQ',
    amount: '',
    type: 2,
    couponJson: [{
      couponType: 0,
      // couponType: 1228,
      couponNum: 1
    }]
  }
}
