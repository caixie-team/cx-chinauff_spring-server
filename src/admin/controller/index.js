const Base = require('./base')
const moment = require('moment');

module.exports = class extends Base {
  async indexAction() {
    // this.meta_title = '首页'
    await this.hook('AdminIndex')

    /******* 用户 *******/
    let todayNewsData = await this.todayNews();
    //今日纳新
    this.assign('todayNews', todayNewsData);

    let allNewsData = await this.allNews();
    //累计纳新
    this.assign('allNews', allNewsData);
    
    /******* 活跃度 *******/
    //今日参与用户
    let todayUserData = await this.todayUser();
    this.assign('todayUser', todayUserData);

    //累计参与用户
    let allUserData = await this.allUser();
    this.assign('allUser', allUserData);

    /******* 优惠券 *******/
    //今日发券
    let todayCouponData = await this.todayCoupon();
    this.assign('todayCoupon', todayCouponData);

    //累计发券
    let allCouponData = await this.allCoupon();
    this.assign('allCoupon', allCouponData);

    /******* 优惠券 *******/
    //今日集福
    let todayBlessingData = await this.todayBlessing()
    this.assign('todayBlessing', todayBlessingData);

    //累计集福
    let allBlessingData = await this.allBlessing()
    this.assign('allBlessing', allBlessingData);

    /******* 礼品 *******/

    //今日预约
    let todayReserveData = await this.todayReserve();
    this.assign('todayReserve', todayReserveData);

    //累计预约
    let allReserveData = await this.allReserve();
    this.assign('allReserve', allReserveData);

    //今日兑换
    let todayExchangeData = await this.todayExchange();
    this.assign('todayExchange', todayExchangeData);

    //累计兑换
    let allExchangeData = await this.allExchange();
    this.assign('allExchange', allExchangeData);

    /******* 发字 *******/
    //今日发字
    let todayFuziData = await this.todayFuzi();
    this.assign('todayFuzi', todayFuziData);

    //累计发字
    let allFuziData = await this.allFuzi();
    this.assign('allFuzi', allFuziData);

    return this.display();
  }

  //今日纳新
  async todayNews() {
    let whereSql = ' a.isNew = 1 ';//纳新用户
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    whereSql += ` and FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') = '${nowDate}' `
    const accountModel = this.model('chinauff_account');
    let count = await accountModel.alias('a').where(whereSql).count();
    return count;
  }

  //累计纳新
  async allNews() {
    let whereSql = ' a.isNew = 1 ';//纳新用户
    const accountModel = this.model('chinauff_account');
    let count = await accountModel.alias('a').where(whereSql).count();
    return count;
  }

  //今日参与用户
  async todayUser(){
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    let  whereSql = ` FROM_UNIXTIME(a.lastLoginTime/1000, '%Y-%m-%d') = '${nowDate}' and a.lastLoginTime is not NULL`
    const accountModel = this.model('chinauff_account');
    let count = await accountModel.alias('a').where(whereSql).count();
    return count;
  }

  //累计参与用户
  async allUser() {
    const accountModel = this.model('chinauff_account');
    let count = await accountModel.count();
    return count;
  }


  //今日发券
  async todayCoupon() {
    const couponUserModel = this.model('activity_coupon_user');
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    const count = await couponUserModel.alias('cu').where(` DATE_FORMAT(cu.create_time, '%Y-%m-%d') = '${nowDate}' `).count();
    return count;
  }

  //累计发券
  async allCoupon() {
    const couponUserModel = this.model('activity_coupon_user');
    const count = await couponUserModel.count();
    return count;
  }

  //今日集福
  async todayBlessing() {
    const model = this.model('activity_blessing_user');
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    const count = await model.where(` DATE_FORMAT(create_time, '%Y-%m-%d') = '${nowDate}' `).count();
    return count;
  }

  //累计集福
  async allBlessing() {
    const model = this.model('activity_blessing_user');
    const count = await model.count();
    return count;
  }

  //今日预约
  async todayReserve() {
    const model = this.model('activity_reserve');
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    const count = await model.where(`reserve_date = '${nowDate}' `).count();
    return count;
  }

  //累计预约
  async allReserve() {
    const model = this.model('activity_reserve');
    const count = await model.count();
    return count;
  }

  //今日兑换
  async todayExchange() {
    const model = this.model('activity_exchange');
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    const count = await model.where(` DATE_FORMAT(create_time, '%Y-%m-%d') = '${nowDate}' `).count();
    return count;
  }

  //累计兑换
  async allExchange() {
    const model = this.model('activity_exchange');
    const count = await model.count();
    return count;
  }

  //今日发字
  async todayFuzi() {
    let nowDate = moment(new Date()).format('YYYY-MM-DD')
    let whereSql = ` DATE_FORMAT(br.create_time, '%Y-%m-%d') = '${nowDate}' `
    const sql = `
                SELECT 
                COUNT(br.blessing_type = 1 OR NULL) AS shiCount,
                COUNT(br.blessing_type = 2 OR NULL) AS yiCount,
                COUNT(br.blessing_type = 3 OR NULL) AS kouCount,
                COUNT(br.blessing_type = 4 OR NULL) AS tianCount
            FROM
                picker_activity_blessing_record br where ${whereSql};
                `
    const blessingRecordModel = this.model('activity_blessing_record');
    const res = await blessingRecordModel.query(sql);
    return res[0];
  }

  //累计发字
  async allFuzi() {
    const sql = `
                SELECT 
                COUNT(br.blessing_type = 1 OR NULL) AS shiCount,
                COUNT(br.blessing_type = 2 OR NULL) AS yiCount,
                COUNT(br.blessing_type = 3 OR NULL) AS kouCount,
                COUNT(br.blessing_type = 4 OR NULL) AS tianCount
            FROM  picker_activity_blessing_record br;
                `
    const blessingRecordModel = this.model('activity_blessing_record');
    const res = await blessingRecordModel.query(sql);
    return res[0];
  }
}
