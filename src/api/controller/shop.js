/* eslint-disable no-useless-constructor */
const Base = require('./base')

/**
 *  商铺信息 API
 * @type {module.exports}
 */
module.exports = class extends Base {
  constructor (...args) {
    super(...args)
    this.setup = think.config('setup')
  }

  async indexAction () {
    if (this.isPost) {
      // 获取用户的坐标
      const data = this.post()
      const lat = data.latitude
      const lon = data.longitude
      const shopModel = this.model('chinauff_shop')
      if (!think.isEmpty(lat)
        && !think.isEmpty(lon)
        && !think._.isNaN(Number(lat))
        && !think._.isNaN(Number(lon))) {
        // FROM picker_chinauff_shop
        // WHERE latitudes > @lat AND latitudes < @lat + 1 AND longitudes > @lon - 1 AND longitudes < @lon + 1
        // ORDER BY ACOS(SIN((@lat * 3.1415) / 180) * SIN((latitudes * 3.1415) / 180) +
        //   COS((@lat * 3.1415) / 180) * COS((latitudes * 3.1415) / 180) * COS((@lon * 3.1415) / 180 -
        //     (longitudes * 3.1415) / 180 )) * 6380 ASC LIMIT 10;
        // 赤道半径 6380千米
        // 6380*2*3.14=40066.4千米
        const nearShopList = await shopModel.where(`latitudes > ${lat} AND latitudes < ${lat} + 1 AND longitudes > ${lon} - 1 AND longitudes < ${lon} + 1`)
          .order(`ACOS(SIN((${lat} * 3.1415) / 180) * SIN((latitudes * 3.1415) / 180) +
        COS((${lat} * 3.1415) / 180) * COS((latitudes * 3.1415) / 180) * COS((${lon} * 3.1415) / 180 -
          (longitudes * 3.1415) / 180 )) * 6380 ASC`).limit(15).select()
        return this.success(nearShopList)
      } else if (!think.isEmpty(data.shopName)) {
        const queryShopList = await shopModel.where({
          shop_name: ['like', `%${data.shopName}%`]
        }).select()
        return this.success(queryShopList)
      } else {
        const shopList = await shopModel.limit(15).select()
        return this.success(shopList)
      }
    }
  }
}
