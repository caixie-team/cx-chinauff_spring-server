module.exports = class extends think.Model {

  /**
   * 获取当天的页面数据
   * @returns {Promise<*>}
   */
  async getDayPageView () {
    const eventModel = this.model('ahoy_event')
    const viewsData = await eventModel
      .field('JSON_UNQUOTE( JSON_EXTRACT(properties, "$.page") ) as page, JSON_UNQUOTE( JSON_EXTRACT(properties, "$.title") ) as title, count(*) as pv, count(DISTINCT visit_id) as uv')
      .where(`name = "$view" and time >= UNIX_TIMESTAMP(date(now())) and time < UNIX_TIMESTAMP(DATE_ADD(date(now()), INTERVAL 1 DAY))`)
      .group(['page ASC', 'title ASC'])
      .select()
    return viewsData
  }

  /**
   * 获取全部页面访问数据
   * @returns {Promise<*>}
   */
  async getAllPageView (page, pageSize) {
    const eventModel = this.model('ahoy_event')
    // 统计总数用于分页
    const total = await eventModel.field(`COUNT(DISTINCT FROM_UNIXTIME(time, '%Y-%m-%d'), properties->>'$.page') as count`).where({
      name: '$view'
    }).find()

    const viewsData = await eventModel
      .field('FROM_UNIXTIME(time, "%Y-%m-%d") AS date, JSON_UNQUOTE( JSON_EXTRACT(properties, "$.page") ) as page_path, ' +
        'JSON_UNQUOTE( JSON_EXTRACT(properties, "$.title") ) as title, ' +
        'name, count(*) as pv, ' +
        'count(DISTINCT visit_id) as uv')
      .where(`name = "$view"`)
      .group(['date DESC', 'page_path ASC', 'title ASC'])
      .page(page, pageSize)
      .countSelect(total.count)
    return viewsData
  }

  async allPages (flat) {
    const pages = await think.cache('page-list', () => {
      return this.getAllPages()
    }, {timeout: 365 * 24 * 3600})
    return pages
  }

  // async getAllPages () {
  //   const where = {}
  //   let pages = []
  //   field('id,title,pid,allow_publish,name,mold')
  // pages = await this.field('page_path').where(where).select()
  // }

  // async allTerms (flag) {
  //   const cacheKey = this.tablePrefix + 'terms';
  //   if (flag) {
  //     await think.cache(cacheKey, null)
  //   }
  //   const ret = await think.cache(cacheKey)
  //
  //   if (think.isEmpty(ret)) {
  //     const data = await this.select()
  //     await think.cache(cacheKey, JSON.stringify(data))
  //   }
  //   const cacheData = await think.cache(cacheKey)
  //   return JSON.parse(cacheData)
  // }

}
