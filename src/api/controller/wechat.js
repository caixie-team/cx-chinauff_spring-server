/* eslint-disable no-useless-constructor */
const Base = require('./base')
const {Wechat} = require('wechat-jssdk');
// const wechatConfig = require('./wechat-config')
const DOMAIN = 'http://wx.caixie.top';
const appId = 'wx40f58df735cd2868'
const appSecret = '745431b820310fe33756ccb3f992b509'
const formstream = require('formstream');
const queryString = require('query-string');
const FormData = require('form-data');
const util = require('util');
const path = require('path');
const httpx = require('httpx');
const liburl = require('url');
const JSONbig = require('json-bigint');
const fs = require('fs');
const utils = require('../../lib/jssdk/utils');

const request = require('request');
// const statAsync = util.promisify(stat);
const {Base64Encode} = require('base64-stream');
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

  async indexAction () {
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

  /**
   * 获取用户授权信息
   * @returns {Promise<*>}
   */
  async oauthAction () {
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
  async signatureAction () {
    // console.log('签名')
    const queryUrl = this.get('url')
    console.log(queryUrl)
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
  async implicitOAuthAction () {
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

  async getMedia (accessToken, mediaId) {
    const url = this.prefix + 'media/get'

    const params = {
      access_token: accessToken,
      media_id: mediaId,
    };
    return utils
      .sendRequest({
        url,
        qs: params,
      })
      .then(data => {
        return data
      })
      .catch(reason => {
        debug('get ticket failed!');
        return Promise.reject(reason);
      });
  }

  base64_encode (file) {
    // read binary data
    let bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
  }

  async getAccessToken () {
    const query = queryString.stringify({
      appid: this.config.appId
    })
    console.log('REQUEST ACCESS TOKEN...')
    console.log('REQUEST PARMS...')
    console.log(query)
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
    console.log('GET ACCESS TOKEN SUCCESS')
    console.log(accessToken)
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
    // console.log(openId)
    const {accessToken} = await this.getAccessToken()
    // console.log(accessToken)
    // await this.got('')
    // const query = queryString.stringify({
    //   appid: this.config.appId
    // })
    // const payload = (await this.got(
    //   '/console/activity/weChat/accessToken',
    //   {
    //     baseUrl: think.config('proxyActivityApi'),
    //     query
    //   }
    // )).body
    // lnj-weixin/console/activity/weChat/accessToken?appid=wxa8299eb7fc27ef04
    // const accessToken = '17_kA-EV4bfnBNq1dYmc-0Wb4AG2Y9n9ijBGkIgy5C3FP3wuiok5X1gkxGWEQWwk1kNvaJeH3wAGcNnnzfFkQ7cFuo0mqARZiTKymfYl_FXj8kxEZr2HUK3evk97P4Y8SKMlDgWnzJIb_R1sunKCVDgAFAHAI'
    const uploadPath = think.ROOT_PATH + '/www/static/upload/picture/' + dateformat("Y-m-d", new Date().getTime());

    think.mkdir(uploadPath);

    const riceFile = uploadPath + '/' + openId + '_rice.jpg'
    console.log('微信的token')
    console.log(accessToken)
    console.log('媒体id')
    console.log(mediaId)

    // /Users/basil/development/chinauff-server/screenshot/test.jpg
    return new Promise((resolve, reject) => {
      const stream = request('https://api.weixin.qq.com/cgi-bin/media/get?access_token=' + accessToken + '&media_id=' + mediaId)
        .pipe(fs.createWriteStream(riceFile));
      console.log(stream)
      stream.on('finish', () => {
        if (think.isFile(riceFile)) {
          const base64 = this.base64_encode(riceFile)
          resolve(base64)
        } else {
          console.log('扫-扫。。。。 errror')
          reject('error')
        }
      })
      console.log('errorr.....')
      reject('error')
    }).then(
      async (base64Data) => {
        const aiService = think.service('ai', 'common', this.aiServer, {
          app_id: this.appId,
          key: this.appKey,
          secret: this.appSecret
        });
        const res = await aiService.image(base64Data)
        console.log('开启百度云识别。。。。。。。。。')
        console.log(res)
        if (res.result_num > 0) {
          for (let item of res.result) {
            if (item.keyword.includes('米') || item.root.includes('食品') || item.root.includes('食物')) {
              return this.success({score: 100})
            } else {
              return this.success({score: new Date().getTime()})
            }
            // if (item.score > 0.4 && item.keyword.includes('米')) {
            // 返回置信度
            // return this.success({score: item.score * 100})
            // console.log(item.score)
            // resolve({score: item.score * 100});
            // }
          }
        }
        if (res.error_code) {
          think.logger.error(res)
          return this.success({score: 100})
          // return this.success({score: new Date().getTime()})
        }
      },
      ({message}) => {
        console.log(message)
        // this.fail(message)
        // 接口出现问题直接成功返回
        return this.success({score: 100})
      }
    );
    return this.success({score: 100})
  }

  /**
   * 获取媒体列表
   * http请求方式: POST
   * https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=ACCESS_TOKEN
   * @returns {Promise<void>}
   */
  async materialAction () {
    if (this.isPost) {
      // {
      //     "type":TYPE,     // 素材的类型，图片（image）、视频（video）、语音 （voice）、图文（news）
      //     "offset":OFFSET, // 从全部素材的该偏移位置开始返回，0表示从第一个素材 返回
      //     "count":COUNT    // 返回素材的数量，取值在1到20之间
      // }
      const param = this.post()
      // console.log(param)
      const global = await wx.store.getGlobalToken
      // console.log(global.accessToken)
      // const accessToken = '17_DSnJkI6eSFuIi_NnKxnnVwteLusD2ScbjqZYhvdWIoWXviHUyHMMkeGO2VD7uyMiF5GjwzaJxaCxbIRwo2XEMD8X1hOXr3yp8FKvt_mX3-Y-q5QMl2LcTFImL24L2rbkNgucrt_6Ll_GtFZIUMLjADAGYX'
      // const accessToken = await wx.jssdk.getAccessToken()
      const accessToken = '17_C3213veG8uoTitMpYgNm6Lqe9qmGXo97j2dvB_RwNFYbTPnL6m5lndQkdLZlkI-OcS1Zj133GY1gekGd_c60kfNFaHb_4cgYSYNu7P-L_QcywRQYCz6THXrWLQyg7a9EkQeR7ZGXjcYwb9jnTOKhAHABWS'
      // const accessToken = '17_V7GB_65T7xPQ-hcg2yVvvD-PehfDi5guRPl94DHlL43iaJ1seLcM871nWL8K9NVMOGciqVlJ3oD6dxO7Wkz_BJXR7J6xra6qcic7w76VnO7TR5noYhrHj_s-h_MDVCaAGANFM'
      // console.log(accessToken)
      const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`
      const query = queryString.stringify(param)

      // const form = new FormData()
      // form.append('type', param.type)
      // form.append('offset', param.offset)
      // form.append('count', param.count)
      const payload = (await this.got.post(
        url,
        {
          json: true,
          body: param
        }
      )).body

      console.log(payload)
      return this.success(payload)
    }
    // https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=ACCESS_TOKEN
  }

  async _promiseRequest ({imgStram = null, imgBuffer = null, accessToken}) {
    const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=image`;
    return new Promise((resolve, reject) => {
      const req = request.post(
        {
          url,
          headers: {
            accept: '*/*',
          },
        },
        (err, res) => {
          if (err) {
            reject(err);
          }

          try {
            const resData = JSON.parse(res.body); // 里面带有返回的media_id

            resolve(resData);
          } catch (e) {
            console.log(e)
          }
        },
      );

      const form = req.form();

      if (imgBuffer) {
        form.append('media', imgBuffer, {
          contentType: 'image/jpeg', // 微信识别需要
          filename: 'code.jpg', // 微信识别需要
        });
      } else if (imgStram) {
        form.append('media', imgStram);
      }

      form.append('hack', ''); // 微信服务器的bug，需要hack一下才能识别到对象
    });
  }


  async uploadMediaAction () {
    const file = think.extend({}, this.file('file'))
    const filepath = file.path
    const extname = path.extname(file.name)
    const basename = path.basename(filepath) + extname;
    const type = 'image'
    const uploadPath = think.ROOT_PATH + '/wwww/static/upload/picture/' + dateformat("Y-m-d", new Date().getTime());

    think.mkdir(uploadPath);

    if (think.isFile(filepath)) {
      fs.renameSync(filepath, uploadPath + '/' + basename);

    } else {
      console.log("文件不存在！")

    }
    file.path = uploadPath + '/' + basename;
    const {accessToken} = await this.getAccessToken()

    const data = await this._promiseRequest({
      imgStram: fs.createReadStream(file.path),
      accessToken
    })
    return this.json(data)
  };

  async request (url, opts, retry) {
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