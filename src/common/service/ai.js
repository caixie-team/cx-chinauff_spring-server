const hwAiImageTagging = require('./ais_sdk/imager_tagging')
const hwAiUtils = require('./ais_sdk/utils')
const {imageClassify} = require('baidu-aip-sdk')
const fs = require('fs');

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
    this.type = type
    if (this.type === 'baidu') {
      this.app_id = config.app_id
    }
    this.app_key = config.key
    this.app_secret = config.secret
  }

  /**
   *
   * @param imageData Base64 Data
   * @returns {Promise}
   */
  async image (imageData) {
    switch (this.type) {
      case 'baidu': {
        const client = new imageClassify(this.app_id, this.app_key, this.app_secret)
        const res = await client.advancedGeneral(imageData)
        return res
      }
      case 'huawei': {
        return await new Promise(resolve => {
          hwAiImageTagging.image_tagging_aksk(this.app_key, this.app_secret, imageData, '', 60, 'zh', 5, (result) => {
            return resolve(result)
          });
        })
      }
    }
  }
}
