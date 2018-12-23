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
    let accountInfo = await this.where({
      openId: openId
    }).find()
    if (think.isEmpty(accountInfo)) {
      const insertId = await this.add({
        openId: openId
      })
    }
    return accountInfo
  }
}
