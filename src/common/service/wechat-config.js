const DOMAIN = 'http://wx.caixie.top';
const appId = 'wx40f58df735cd2868'
const appSecret = '745431b820310fe33756ccb3f992b509'

module.exports = {
  //set your oauth redirect url, defaults to localhost
  wechatRedirectUrl: `${DOMAIN}/oauth`,
  //"wechatToken": "wechat_token", //not necessary required
  appId: 'appid',
  appSecret: 'app_secret',
  card: false, //enable cards
  payment: false, //enable payment support
  merchantId: '', //
  // paymentSandBox: true, //dev env
  // paymentKey: '', //API key to gen payment sign
  // paymentCertificatePfx: fs.readFileSync(path.join(process.cwd(), 'cert/apiclient_cert.p12')),
  //default payment notify url
  // paymentNotifyUrl: `http://your.domain.com/api/wechat/payment/`,
  //mini program config
  'miniProgram': {
    'appId': 'mp_appid',
    'appSecret': 'mp_app_secret',
  }
}