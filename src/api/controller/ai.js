/* eslint-disable no-useless-constructor */
const Base = require('./base')

/**
 *  AI 识别服务
 * @type {module.exports}
 */
module.exports = class extends Base {
  constructor (...args) {
    super(...args)
    this.setup = think.config('setup')
    this.aiServer = this.setup.AI_SERVER
    console.log(this.aiServer)
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

  /**
   * 验证图片
   * @returns {Promise<*>}
   */
  async postAction () {
    const data = this.post()
    if (data.file) {
      switch (this.aiServer) {
        case 'baidu': {
          const aiService = think.service('ai', 'common', this.aiServer, {
            app_id: '15069191',
            key: this.appKey,
            secret: this.appSecret
          });
          const res = await aiService.image(data.file)
          if (res.result_num > 0) {
            for (let item of res.result) {
              if (item.score > 0.6 && item.keyword.includes('米')) {
                // 返回置信度
                return this.success({score: item.score * 100})
              }
            }
          }
          if (res.error_code) {
            think.logger.error(res)
          }
          return this.success({score: 0})
        }
        case 'huawei': {
          const aiService = think.service('ai', 'common', this.aiServer, {
            key: this.appKey,
            secret: this.appSecret
          });
          let res = await aiService.image(data.file)
          res = JSON.parse(res)
          if (res.result) {
            const tags = res.result.tags
            for (let item of tags) {
              if (item.confidence > 60 && item.tag.includes('米')) {
                // 返回置信度
                return this.success({score: item.confidence})
              }
            }
          }
          return this.success({score: 0})
        }
      }
    }
    return this.fail()
  }
}