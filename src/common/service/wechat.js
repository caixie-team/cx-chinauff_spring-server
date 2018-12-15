const fs = require('fs');
const { Wechat } = require('wechat-jssdk');
const wechatConfig = require('./wechat-config')
const wx = new Wechat(wechatConfig);

module.exports = class extends think.Service {
  /**
   * init
   * @param  {Number} userId []
   * @param  {Object} config []
   * @param  {Object} http   []
   * @return {}        []
   */
  constructor (type, config) {
    super()
    // this.wx = new Wechat(wechatConfig);
  }

}
