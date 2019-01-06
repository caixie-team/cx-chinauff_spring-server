/* eslint-disable no-useless-constructor */
const Base = require('./base')
const {Wechat} = require('wechat-jssdk');
// const wechatConfig = require('./wechat-config')
const DOMAIN = 'http://wx.caixie.top';
const appId = 'wx40f58df735cd2868'
const appSecret = '745431b820310fe33756ccb3f992b509'
// const formstream = require('formstream');
const queryString = require('query-string');
// const FormData = require('form-data');
// const util = require('util');
// const path = require('path');
// const httpx = require('httpx');
// const liburl = require('url');
// const JSONbig = require('json-bigint');
const fs = require('fs');
// const utils = require('../../lib/jssdk/utils');
// const superagent = require('superagent');
// const {getMedia} = require('co-wechat-api/lib/api_media');
const {getMedia} = require('../../lib/api_media')

const request = require('request');
// const statAsync = util.promisify(stat);
// const {Base64Encode} = require('base64-stream');
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
// 本文件用于wechat API，基础文件，主要用于Token的处理和mixin机制
const httpx = require('httpx');
const liburl = require('url');
const JSONbig = require('json-bigint');

const wx = new Wechat(wechatConfig);
const rp = require('request-promise');
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
    this.prefix = 'https://api.weixin.qq.com/cgi-bin/';
    this.mpPrefix = 'https://mp.weixin.qq.com/cgi-bin/';
    this.fileServerPrefix = 'http://file.api.weixin.qq.com/cgi-bin/';
    // http://file.api.weixin.qq.com/cgi-bin
    this.payPrefix = 'https://api.weixin.qq.com/pay/';
    this.merchantPrefix = 'https://api.weixin.qq.com/merchant/';
    this.customservicePrefix = 'https://api.weixin.qq.com/customservice/';


    this.setup = think.config('setup')
    this.config = think.config('wechat')
    this.aiServer = this.setup.AI_SERVER
    if (this.setup.AI_SERVER === 'baidu') {
      this.appId = this.setup.AI_BAIDU_APP_ID
      this.appKey = this.setup.AI_BAIDU_APP_KEY
      this.appSecret = this.setup.AI_BAIDU_APP_SECRET
    }
    if (this.setup.AI_SERVER === 'huawei') {
      this.appKey = this.setup.AI_HW_APP_KEY
      this.appSecret = this.setup.AI_HW_APP_SECRET
    }
  }


  base64_encode (file) {
    // read binary data
    let bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
  }

  async getAccessToken () {
    const query = queryString.stringify({
      // appid: 'wxa8299eb7fc27ef04'
      appid: 'wxb44ce8b8c5cfdc0a'
    })
    const payload = await this.got(
      '/console/activity/weChat/accessToken',
      {
        baseUrl: think.config('proxyActivityApi'),
        query
      }
    )
    const data = JSON.parse(payload.body)
    let accessToken = null
    if (data.errcode == 0) {
      accessToken = data.data
      // return data.data
    }
    return {
      accessToken
    }
  }

  /**
   * 获取临时素材
   * 详情请见：<http://mp.weixin.qq.com/wiki/11/07b6b76a6b6e8848e855a435d5e34a5f.html>
   * Examples:
   * ```
   * api.getMedia('media_id');
   * ```
   * - `result`, 调用正常时得到的文件Buffer对象
   * - `res`, HTTP响应对象
   * @param {String} mediaId 媒体文件的ID
   */
  async oneMediaAction () {
    const data = this.post()
    // console.log('扫-扫。。。。')
    // console.log(data)
    if (!think._.has(data, 'mediaId') || !think._.has(data, 'openId')) {
      return this.fail()
    }
    const {mediaId, openId} = data
    const {accessToken} = await this.getAccessToken()
    const uploadPath = think.ROOT_PATH + '/www/static/upload/picture/' + dateformat("Y-m-d", new Date().getTime());

    think.mkdir(uploadPath);

    const riceFile = uploadPath + '/' + openId + '_rice.jpg'
    // console.log('微信的token')
    // console.log(accessToken)
    // console.log('媒体id')
    // console.log(mediaId)
    // const longpic = await this.spiderImage(pic, uploadPath, name);
    // paths = longpic;
    console.log(accessToken)
    console.log(mediaId)
    const mediaInfo = await getMedia(request, accessToken, mediaId).pipe(fs.createWriteStream(riceFile))

    console.log(mediaInfo)
    return this.success({score: 100})
    //
    // // /Users/basil/development/chinauff-server/screenshot/test.jpg
    // return new Promise((resolve, reject) => {
    //   const stream = request('https://api.weixin.qq.com/cgi-bin/media/get?access_token=' + accessToken + '&media_id=' + mediaId)
    //     .pipe(fs.createWriteStream(riceFile));
    //   console.log(stream)
    //   stream.on('finish', () => {
    //     if (think.isFile(riceFile)) {
    //       const base64 = this.base64_encode(riceFile)
    //       resolve(base64)
    //     } else {
    //       // console.log('扫-扫。。。。 errror')
    //       reject('error')
    //     }
    //   })
    //   // console.log('errorr.....')
    //   reject('error')
    // }).then(
    //   async (base64Data) => {
    //     const aiService = think.service('ai', 'common', this.aiServer, {
    //       app_id: this.appId,
    //       key: this.appKey,
    //       secret: this.appSecret
    //     });
    //     const res = await aiService.image(base64Data)
    //     // console.log('开启百度云识别。。。。。。。。。')
    //     // console.log(res)
    //     if (res.result_num > 0) {
    //       for (let item of res.result) {
    //         if (item.keyword.includes('米') || item.root.includes('食品') || item.root.includes('食物')) {
    //           return this.success({score: 100})
    //         } else {
    //           return this.success({score: new Date().getTime()})
    //         }
    //         // if (item.score > 0.4 && item.keyword.includes('米')) {
    //         // 返回置信度
    //         // return this.success({score: item.score * 100})
    //         // console.log(item.score)
    //         // resolve({score: item.score * 100});
    //         // }
    //       }
    //     }
    //     if (res.error_code) {
    //       think.logger.error(res)
    //       return this.success({score: 100})
    //       // return this.success({score: new Date().getTime()})
    //     }
    //   },
    //   ({message}) => {
    //     // console.log(message)
    //     // this.fail(message)
    //     // 接口出现问题直接成功返回
    //     return this.success({score: 100})
    //   }
    // );
    // return this.success({score: 100})
  }

  /**
   * 设置urllib的hook
   */
  async request(url, opts, retry) {
    if (typeof retry === 'undefined') {
      retry = 3;
    }

    var options = {};
    Object.assign(options, this.defaults);
    opts || (opts = {});
    var keys = Object.keys(opts);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key !== 'headers') {
        options[key] = opts[key];
      } else {
        if (opts.headers) {
          options.headers = options.headers || {};
          Object.assign(options.headers, opts.headers);
        }
      }
    }

    var res = await httpx.request(url, options);
    if (res.statusCode < 200 || res.statusCode > 204) {
      var err = new Error(`url: ${url}, status code: ${res.statusCode}`);
      err.name = 'WeChatAPIError';
      throw err;
    }

    var buffer = await httpx.read(res);
    var contentType = res.headers['content-type'] || '';
    if (contentType.indexOf('application/json') !== -1) {
      var data;
      var origin = buffer.toString();
      try {
        data = JSONbig.parse(replaceJSONCtlChars(origin));
      } catch (ex) {
        let err = new Error('JSON.parse error. buffer is ' + origin);
        err.name = 'WeChatAPIError';
        throw err;
      }

      if (data && data.errcode) {
        let err = new Error(data.errmsg);
        err.name = 'WeChatAPIError';
        err.code = data.errcode;

        if ((err.code === 40001 || err.code === 42001) && retry > 0 && !this.tokenFromCustom) {
          // 销毁已过期的token
          await this.saveToken(null);
          let token = await this.getAccessToken();
          let urlobj = liburl.parse(url, true);

          if (urlobj.query && urlobj.query.access_token) {
            urlobj.query.access_token = token.accessToken;
            delete urlobj.search;
          }

          return this.request(liburl.format(urlobj), opts, retry - 1);
        }

        throw err;
      }

      return data;
    }

    return buffer;
  }


}
