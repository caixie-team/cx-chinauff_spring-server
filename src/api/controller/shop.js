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
    // 针对店铺做查询缓存 all shop...
    if (this.isPost) {
      // 获取用户的坐标
      const data = this.post()
      console.log(data)
      const lat = data.latitude
      const lon = data.longitude
      const shopModel = this.model('chinauff_shop')
      let fields = ['id', 'shop_code', 'shop_name', 'address']
      let query = {}
      let orderBy = []
      if (!think.isEmpty(lat)
        && !think.isEmpty(lon)
        && !think._.isNaN(Number(lat))
        && !think._.isNaN(Number(lon))) {
        const distanceField = `
           ROUND(
            6378.138 * 2 * ASIN(
        	  SQRT(
        		  POW(
        			  SIN(
        				  (
        					  ${lat} * PI() / 180 - latitudes * PI() / 180
        				  ) / 2
        			  ),
        			  2
        		  ) + COS(${lat} * PI() / 180) * COS(latitudes * PI() / 180) * POW(
        			  SIN(
        				  (
        					  ${lon} * PI() / 180 - longitudes * PI() / 180
        				  ) / 2
        			  ),
        			  2
        		  )
        	  )
          ) * 1000) AS distance`
        fields.push(distanceField)
        orderBy.push(`isNull(distance), distance ASC`)
      }
      if (!think.isEmpty(data.shopName)) {
        query.shop_name = ['like', `%${data.shopName}%`]
      }
      const nearShopList = await shopModel
        .field(fields)
        .where(query)
        .order(orderBy)
        .limit(15)
        .select()
      return this.success(nearShopList)
    }
  }
}


////
// FROM picker_chinauff_shop
// WHERE latitudes > @lat AND latitudes < @lat + 1 AND longitudes > @lon - 1 AND longitudes < @lon + 1
// ORDER BY ACOS(SIN((@lat * 3.1415) / 180) * SIN((latitudes * 3.1415) / 180) +
//   COS((@lat * 3.1415) / 180) * COS((latitudes * 3.1415) / 180) * COS((@lon * 3.1415) / 180 -
//     (longitudes * 3.1415) / 180 )) * 6380 ASC LIMIT 10;
// 赤道半径 6380千米
// 6380*2*3.14=40066.4千米
// const nearShopList = await shopModel.field(`
// ACOS(SIN((${lat} * 3.1415) / 180) * SIN((latitudes * 3.1415) / 180) +
// COS((${lat} * 3.1415) / 180) * COS((latitudes * 3.1415) / 180) * COS((${lon} * 3.1415) / 180 -
//   (longitudes * 3.1415) / 180 )) * 6380 /1000 as distance
//   `).where(`latitudes > ${lat} AND latitudes < ${lat} + 1 AND longitudes > ${lon} - 1 AND longitudes < ${lon} + 1`)
//   .order(`distance ASC`).limit(15).select()
