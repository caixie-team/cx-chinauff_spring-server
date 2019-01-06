/* eslint-disable no-undef,no-const-assign */
// import speakeasy from 'speakeasy';
const jwt = require('jsonwebtoken')
const Base = require('./base')

module.exports = class extends Base {
  /**
   * 用户访问
   * @returns {Promise<void>}
   */
  async visitsAction () {
    const currentTime = new Date().getTime()
    let data = this.post()
    const visitModel = this.model('ahoy_visit')
    data.create_time = currentTime
    await visitModel.add(data)
  }

  /**
   * 用户事件
   * @returns {Promise<void>}
   */
  async eventsAction () {
    let data = this.post()
    const visitModel = this.model('ahoy_visit')
    // console.log(data)
    const visitor = await visitModel.where({
      // visitor_token: data.visitor_token
      visit_token: data.visit_token
    }).find()
    // console.log(visitor)
    const eventModel = this.model('ahoy_event')
    const eventData = JSON.parse(data.events_json)[0]
    const properties = eventData.properties
    // console.log(properties)
    await eventModel.add({
      visit_token: data.visit_token,
      visitor_token: data.visitor_token,
      name: eventData.name,
      visit_id: visitor.id,
      properties: JSON.stringify(eventData.properties),
      time: eventData.time
    })

    const analyticsModel = this.model('analytics')
    const dayView = await analyticsModel.getDayPageView()
    const allView = await analyticsModel.getAllPageView()
    // console.log('---- day view ----')
    console.log(dayView)
    // console.log('---- alll view ----')
    // console.log(allView)
  }
}
