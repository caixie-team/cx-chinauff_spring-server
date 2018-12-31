/* eslint-disable no-undef */

/**
 * 店铺信息
 * @type {module.exports}
 */
module.exports = class extends think.Model {

  constructor (...args) {
    super(...args)
  }
  get tableName () {
    return 'picker_chinauff_shop';
  }
  /**
   * 获取全部店铺
   * @param flag
   * @returns {Promise<void>}
   */
  async allShops (flag) {}
}
