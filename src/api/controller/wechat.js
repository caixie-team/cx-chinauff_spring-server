/* eslint-disable no-useless-constructor */
const Base = require('./base')
const {Wechat} = require('wechat-jssdk');
// const wechatConfig = require('./wechat-config')
const DOMAIN = 'http://wx.caixie.top';
const appId = 'wx40f58df735cd2868'
const appSecret = '745431b820310fe33756ccb3f992b509'

const wechatConfig = {
  //set your oauth redirect url, defaults to localhost
  wechatRedirectUrl: `${DOMAIN}`,
  //"wechatToken": "wechat_token", //not necessary required
  appId: appId,
  appSecret: appSecret,
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
const wx = new Wechat(wechatConfig);

module.exports = class extends Base {
  constructor (...args) {
    super(...args)
    // Session Key 主要处理小程序相关业务
    this.getSessionKey = async (openid) => {
      await think.cache(`session_${openid}`)
    }
    this.saveSessionKey = async (openid, sessionkey) => {
      await think.cache(`session_${openid}`, sessionkey)
    }
  }

  async getAction () {
    const action = this.get('action')
    if (!think.isEmpty(action)) {
      switch (action) {
        case 'signature': {
          return await this.getSignature()
        }
        case 'implicit': {
          return await this.getImplicitOAuth()
        }
        case 'oauth': {
          return await this.getOAuth()
        }
      }
    } else {
      // 静默授权地址
      const implicitOAuthUrl = wx.oauth.generateOAuthUrl(
        DOMAIN,
        'snsapi_base'
      )
      return this.success({
        oauthUrl: wx.oauth.snsUserInfoUrl,
        implicitOAuth: implicitOAuthUrl
      })
    }
  }

  /**
   * 获取用户授权信息
   * @returns {Promise<*>}
   */
  async oauth () {
    const code = this.get('code')
    const key = await this.ctx.session('openid');
    const profile = await wx.oauth.getUserInfo(code, key)
    if (!think.isEmpty(profile)) {
      await this.ctx.session('openid', profile.openid)
      return this.success(profile)
    }
  }

  /**
   * 获取签名配置信息
   *
   * @returns {Promise<any>}
   */
  async getSignature () {
    const queryUrl = this.get('url')
    if (queryUrl) {
      return await wx.jssdk.getSignature(queryUrl).then(
        data => {
          return this.success(data)
        },
        reason => {
          console.error(reason);
          return this.fail(data)
        }
      );
    }
  }

  /**
   * 静默获取用户信息
   * @returns {Promise<void>}
   */
  async getImplicitOAuth () {
    // const code = this.get('code')
    const redirect = this.get('callback')
    // wx.oauth.getUserBaseInfo(code).then(function (tokenInfo) {
    //   console.log('implicit oauth: ', tokenInfo);
    // console.log('implicit oauth: ', JSON.stringify(tokenInfo));
    // req.session.openid = tokenInfo.openid;
    // if (redirect) {
    //   res.redirect(redirect);
    //   return;
    // }
    // res.render('oauth', {
    //   wechatInfo: JSON.stringify(tokenInfo, null, 2),
    // });
    // })

    const code = this.get('code')
    const key = await this.ctx.session('openid');
    const tokenInfo = await wx.oauth.getUserBaseInfo(code)
    if (!think.isEmpty(tokenInfo)) {
      await this.ctx.session('openid', tokenInfo.openid)
      if (redirect) {
        // res.redirect(redirect);
        // return;
        return this.redirect(redirect);
      }
      // 验证用户是否已经存在
      // 从 redis 查询用户
      // 从数据库中查询用户
      // 跳转至用户信息授权页
      return this.success(tokenInfo)
    }
  }

  /**
   * 从缓存 code 中获取 code 信息
   * @returns {Promise<void>}
   */
  async getOauthFromCache () {
    // const key = session openid
    wx.oauth
      .getUserInfo(null, key)
      .then(function (userProfile) {
        console.log(userProfile);
        // res.render('oauth', {
        //   wechatInfo: JSON.stringify(userProfile),
        // });
      })
      .catch(() => {
        //need to get new code
        // res.redirect(wx.oauth.snsUserInfoUrl);
      });
  }
}

