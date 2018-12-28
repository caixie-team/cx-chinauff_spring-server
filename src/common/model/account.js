/* eslint-disable no-warning-comments,no-undef */
module.exports = class extends think.Model {
  get tableName () {
    return 'picker_chinauff_account';
  }

  /**
   * 加载活动账户信息或创建新活动账户
   * @returns {Promise<void>}
   */
  async loadOrCreate (openId) {
    const field = [
      'id',
      'openId',
      'name',
      'cardNo',
      'createTime',
      'lastLoginTime'
    ]
    let accountInfo = await this.field(field).where({
      openId: openId
    }).find()
    if (think.isEmpty(accountInfo)) {
      const insertId = await this.add({
        openId: openId,
        createTime: new Date().getTime()
      })
      if (insertId) {
        accountInfo = await this.where({
          openId: openId
        }).find()
      }
    }
    accountInfo = await this.formatJsonData(accountInfo)
    return accountInfo
  }

  /**
   * 更新账户信息
   * @param openId
   * @param data
   * @returns {Promise<*>}
   */
  async save (openId, data) {
    let saveData = {
      updateTime: new Date().getTime(),
      lastLoginTime: new Date().getTime(),
    }
    if (think._.has(data, 'userInfo')) {
      saveData.userInfo = JSON.stringify(data.userInfo)
      saveData.name = data.userInfo.name
    }
    if (think._.has(data, 'cardInfo')) {
      saveData.cardInfo = JSON.stringify(data.cardInfo)
      saveData.cardNo = data.cardInfo.cardNo
    }
    // 更新信息
    await this.where({
      openId
    }).update(saveData)

    const field = [
      'id',
      'openId',
      'name',
      'cardNo',
      'createTime',
      'lastLoginTime'
    ]
    let newData = await this.field(field).where({openId}).find()
    const dealData = await this.formatJsonData(newData)

    return dealData
  }

  /**
   * 格式化处理 json string 数据
   * @param data
   * @returns {Promise<*>}
   */
  async formatJsonData (data) {
    if (think._.has(data, 'userInfo')) {
      data.userInfo = JSON.parse(data.userInfo)
    }
    if (think._.has(data, 'cardInfo')) {
      data.cardInfo = JSON.parse(data.cardInfo)
    }
    return data
  }
}
