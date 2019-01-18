const Base = require('./base')
const moment = require('moment');
const _ = require('lodash');
const queryString = require('query-string')
// const FormData = require('form-data');

/**
 * 优惠券 API
 * @type {module.exports}
 */
module.exports = class extends Base {
  constructor (ctx) {
    super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
    // 其他额外的操作
    this.db = this.model('activity_coupon');
    // this.key = 'bacd$!#@'; //秘钥
  }


  /**
   * 抽奖
   */
  async hitAction () {

    await this.validateActivityDate(); // 验证活动时间
    // console.log('HIT ACITON.....')
    let data = this.post()
    // console.log(data)
    if (think.isEmpty(data.openId)) {
      // console.log('error .....')
      return this.fail('请求参数错误')
    }

    let isHelp = false;
    // 如果是被加密的，进行解密（用于助力时传过来的 beOpenIdproxyCrmApi）
    if (!think.isEmpty(data.encrypt)) {
      //暂时没有用
      data.beOpenId = decrypt(data.beOpenId, this.key);
      isHelp = true;
    }

    // 判断openid是否存在
    const chinauffAccountModel = this.model('chinauff_account')
    const chinauffAccount = await chinauffAccountModel.where({openId: data.openId}).find();
    if (think.isEmpty(chinauffAccount)) {
      return this.fail(1004, '活动账户不存在')
    }

    const nowDate = moment(new Date()).format('YYYY-MM-DD')
    if (!isHelp) { //走正常逻辑
      //是否到达参与限制
      const blessingTimesModel = this.model('activity_blessing_times');
      const times = await blessingTimesModel.where({ join_date: nowDate, openid: data.openId }).count('id');
      if (times >= 3) {
        return this.fail('今日可参与次数已用完')
      }
    }

    /** *************************************************/
    // step1 判断该活动账户是否有未领取的优惠券，如果有，则把未领取的优惠券返给他

    // 未领取的优惠券  todo 该限制以去掉
    // await this.unreceived(data.openId);

    /** *************************************************/
    // step2 判断当前时间是否在 2019.01.10-2019.01.20周期内

    // 发会员充值卡 (2019-01-13 去掉发卡功能)
    // await this.sendCard(data.openId);

    /** *************************************************/
    // step3 走正常的优惠券领取流程

    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    // console.log(`******** 当前日期: ${currentDate} *******`)

    const cycleData = await this.getCycle(currentDate);
    if (think.isEmpty(cycleData)) {
      return this.fail(1005, '不在活动期间')
    }

    // 判断当前是否有到达发福字的条件
    await this.getRule(data.openId, cycleData.cycle, cycleData.rate)

    await this.getCoupon(data.openId, cycleData);
  }

  /**
   * 验证活动日期
   */
  async validateActivityDate () {
    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    if (currentDate < '2019-01-05') {
      return this.fail(1002, '活动未开始');
    } else if (currentDate > '2019-02-04') {
      return this.fail(1003, '活动已结束');
    }
  }

  /**
   * 未领取的优惠券
   * @param {微信openId} openId
   */
  async unreceived (openId) {
    const couponUserModel = this.model('activity_coupon_user')
    const sql = `
            SELECT 
                 cu.coupon_code,cu.openid,c.coupon_name,c.type_code
            FROM
                picker_activity_coupon_user cu
                    LEFT JOIN
                picker_activity_coupon c ON cu.coupon_id = c.id
            WHERE
                openid = '${openId}'
                    AND receive_status = 1
            LIMIT 1;`;
    const res = await couponUserModel.query(sql);
    if (!think.isEmpty(res)) { // 有未领取的优惠券
      // console.log('*******返回未领取的优惠券******')
      return this.success({
        type: 1,     // 1 优惠券 2 充值卡
        coupon: res[0]
      });
    }
  }

  /**
   * 发充值卡
   * @param {微信openId} openId
   */
  async sendCard (openId) {
    const couponUserModel = this.model('activity_coupon_user')
    const cardModel = this.model('activity_card');
    const cardUserModel = this.model('activity_card_user');

    const nowTime = new Date().getTime(); // 当前时间
    const startTime = new Date('2019-01-10 00:00:00').getTime();  // 充值卡发放开始时间
    const endTime = new Date('2019-01-20 23:59:59').getTime();    // 充值卡发放结束时间
    if (nowTime >= startTime && nowTime <= endTime) {
      // console.log('******** 会员充值卡产生时间 *******')

      // 先判断该用户是否已经领过会员充值卡 (每个用户仅限收到1张卡)
      const cardUserData = await cardUserModel.where({
        openid: openId
      }).find();

      if (!think.isEmpty(cardUserData)) {
        // console.log('********该用户中过会员充值卡*******')
        if (think.isEmpty(cardUserData.receive_time)) {
          // console.log('********将中奖未领取的会员充值卡返给用户*******')

          const cardData = await cardModel.where({
            id: cardUserData.card_id
          }).find();
          return this.success({
            type: 2,     // 1 优惠券 2 充值卡
            card: {
              openid: openId,
              card_type: Number(cardData.card_type),
              card_name: cardData.card_name,
              card_code: cardUserData.card_code
            }
          });
        }
      } else {
        // 获取中奖的次数
        const cuNum = await couponUserModel.count('id');    // 发出优惠券数
        const cardNum = await cardUserModel.count('id');    // 发出充值卡数

        if ((cuNum + cardNum + 1) % 51 == 0) { // 可发充值卡
          // let randCardSql = 'SELECT * FROM picker_activity_card ORDER BY RAND() LIMIT 1;'; //支持多种会员充值卡

          const randCardSql = 'SELECT * FROM picker_activity_card LIMIT 1;';
          const cards = await cardModel.query(randCardSql);
          const card_code = Generate.id();
          await cardUserModel.add({
            openid: openId,
            card_id: cards[0].id, // 充值卡Id
            address: null,  // 收获地址
            recipient_name: null, // 收件人姓名
            phone_number: null, // 手机号码
            receive_time: null, // 领取时间
            card_code: card_code, // 充值卡码(用于更新用户所获取的充值卡信息)
            create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          });
          return this.success({
            type: 2,     // 1 优惠券 2 充值卡
            card: {
              openid: openId,
              card_type: Number(cards[0].card_type),
              card_name: cards[0].card_name,
              card_code: card_code
            }
          });
        }
      }
    } else {
      // console.log('******** 不在会员充值卡产生时间 *******')
    }
  }

  /**
   * 获取周期日期
   * @param {当前日期} currentDate
   */
  async getCycle (currentDate) {
    // 第一阶段
    const one_start_date = '2019-01-05';
    const one_end_date = '2019-01-09';

    // 第二阶段
    const two_start_date = '2019-01-10';
    const two_end_date = '2019-01-15';

    // 第三阶段
    const three_start_date = '2019-01-16';
    const three_end_date = '2019-01-21';

    // 第四阶段
    const four_start_date = '2019-01-22';
    const four_end_date = '2019-01-26';

    // 第五阶段
    const five_start_date = '2019-01-27';
    const five_end_date = '2019-02-01';

    // 第六阶段
    const six_start_date = '2019-02-02';
    const six_end_date = '2019-02-04';

    let data = null;

    if (currentDate >= one_start_date && currentDate <= one_end_date) { // 第一周期
      data = {
        startDate: one_start_date,
        endDate: one_end_date,
        master_total: 150000,
        spare_total: 50349,
        cycle: 1,
        rate: 5
      }
    } else if (currentDate >= two_start_date && currentDate <= two_end_date) { // 第二周期
      data = {
        startDate: two_start_date,
        endDate: two_end_date,
        master_total: 160000,
        spare_total: 60349,
        cycle: 2,
        rate: 8
      }
    } else if (currentDate >= three_start_date && currentDate <= three_end_date) { // 第三周期
      data = {
        startDate: three_start_date,
        endDate: three_end_date,
        master_total: 130000,
        spare_total: 50349,
        cycle: 3,
        rate: 8
      }
    } else if (currentDate >= four_start_date && currentDate <= four_end_date) { // 第四周期
      data = {
        startDate: four_start_date,
        endDate: four_end_date,
        master_total: 120000,
        spare_total: 60349,
        cycle: 4,
        rate: 8
      }
    } else if (currentDate >= five_start_date && currentDate <= five_end_date) { // 第五周期
      data = {
        startDate: five_start_date,
        endDate: five_end_date,
        master_total: 130000,
        spare_total: 50349,
        cycle: 5,
        rate: 5
      }
    } else if (currentDate >= six_start_date && currentDate <= six_end_date) { // 第六周期
      data = {
        startDate: six_start_date,
        endDate: six_end_date,
        master_total: 63626,
        spare_total: 63626,
        cycle: 6,
        rate: 12
      }
    }
    return data;
  }

  /**
   * 获取规则
   */
  async getRule (openId, cycle, rate) {
    const ruleRecordModel = this.model('activity_rule_record');
    const count = await ruleRecordModel.where({
      cycle: cycle
    }).count('id');

    if ((count + 1) % rate == 0) { // 可以发福字
      const ruleModel = this.model('activity_rule');
      await ruleModel.add({
        openid: openId,
        cycle: cycle,
        status: 1, // 可发福字状态 1可发字 2不可发字
        create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })
    }
  }


  /**
   * 获取优惠券
   * @param {微信openId} openId
   * @param {startDate,endDate,master_total,spare_total, cycle} cycleData
   */
  async getCoupon (openId, cycleData) {
    let coupon = {};
    const couponUserModel = this.model('activity_coupon_user')

    // 判断在周期内 , 发券总数是否超过设定限制
    // 周期总数 = 主库存数 + 备用库存数

    const conponCycleTotal = await couponUserModel.where({
      cycle: cycleData.cycle
    }).count('id');
    if (conponCycleTotal >= (cycleData.master_total + cycleData.spare_total)) {
      // console.log('没奖品了。。。。')
      return this.fail(1007, '奖品已被领完');
    }

    let stockMark = 1; // 库存标识 1主库存 2备用库存
    do {
      // 库存是否还有优惠券奖品
      const stockCount = await couponUserModel.where({
        stock_mark: stockMark,
        cycle: cycleData.cycle
      }).count('id');
      if (stockMark == 1) { // 主库存
        if (stockCount >= cycleData.master_total) {
          // console.log(`******* 主库存奖品已经被领完 启用备用库存 ******`)
          stockMark = 2;// 走备用库存
          continue;
        }
      } else { // stockMark == 2
        if (stockCount >= cycleData.spare_total) {
          // console.log(`******* 备用库存奖品已经被领完 ******`)
          return this.fail(1007, '奖品已被领完');
        }
      }

      // 优惠券奖品列表
      const coupons = await this.getCoupons(cycleData, stockMark,openId);
      coupon = await this.lottery(coupons);
      // console.log('优惠劵奖品列表')
      // console.log(coupons)
      // console.log('优惠劵')
      // console.log(coupon)


      // 1.如果周期内，某类型券的发放券数用完，那么该券停止发放；
      // const couponCount = await couponUserModel.where({
      //   coupon_id: coupon.id,
      //   cycle: cycleData.cycle
      // }).count('id');

      // if (coupon.num <= couponCount) { // 该优惠券奖品已经用完
      //   coupon = {}
      //   continue; // 继续下一轮抽奖,一直抽到符合条件为止
      // }

      // 2.要求整个活动期，同一用户免费券同一类最多2张，其他券同一类最多3张
      // const couponLimitNum = await couponUserModel.where({
      //   coupon_id: coupon.id,
      //   openid: openId
      // }).count('id');

      // if (coupon.type_code == 3409 && couponLimitNum >= 2) { // 免费券
      //   // console.log(`******* 整个活动期，同一用户免费券同一类最多2张 ******`)
      //   coupon = {}
      //   continue; // 继续下一轮抽奖,一直抽到符合条件为止
      // } else if (couponLimitNum >= 3) {
      //   // console.log(`******* 整个活动期，同一用户其他券同一类最多3张 ******`)
      //   coupon = {}
      //   continue; // 继续下一轮抽奖,一直抽到符合条件为止
      // }

      // console.log(`******* 优惠券奖品正常 ******`)
      break;
    } while (true)

    await this.hitHandle(openId, coupon, cycleData.cycle, stockMark);
  }

  /**
   * 获取优惠券列表
   * @param {startDate 开始时间,endDate 结束时间,master_total 主库存,spare_total 备用库存, cycle 周期} cycleData
   * @param {库存标识 1主库存 2备用库存} stockMark
   */
  async getCoupons (cycleData, stockMark,openId) {
    // const sql = `
    //         SELECT 
    //         id,coupon_name,type_code,rate
    //         FROM
    //             picker_activity_coupon
    //         WHERE
    //             stock_mark = ${stockMark}
    //                 AND start_date >= '${cycleData.startDate}'
    //                 AND end_date <= '${cycleData.endDate}';
    //     `

    let sql = `    
      SELECT 
        *
        FROM
        (SELECT 
            c.id,
                c.coupon_name,
                c.type_code,
                c.rate,
                CAST(50349 * c.rate AS SIGNED) AS num,
                (SELECT 
                          COUNT(1)
                    FROM
                        picker_activity_coupon_user cu
                    WHERE
                        c.id = cu.coupon_id) AS tempCount,
                        (SELECT 
                        COUNT(1)
                    FROM
                        picker_activity_coupon_user cu
                    WHERE
                        c.id = cu.coupon_id 
                        and 
                        cu.openid='${openId}' 
                        and cu.type_code = 3409
                        ) AS couponLimitNum,
                          (SELECT 
                        COUNT(1)
                    FROM
                        picker_activity_coupon_user cu
                    WHERE
                        c.type_code = cu.type_code 
                        and 
                        cu.openid='${openId}' 
                        ) AS couponLimitCount
        FROM
            picker_activity_coupon c
        WHERE
            c.stock_mark = ${stockMark}
                AND c.start_date >= '${cycleData.startDate}'
                AND c.end_date <= '${cycleData.endDate}'
                AND c.rate > 0
        GROUP BY c.id) t
        WHERE
        num > tempCount and couponLimitNum<2 and couponLimitCount<3;
    `

    const list = await this.db.query(sql); // 获取优惠券奖品列表
    return list;
    // if (think.isEmpty(list)) {
    //   return null;
    // }

    // const coupons = [];
    // for (const item of list) {
    //   if (item.rate > 0) { // 奖池里只有概率大于0的奖品
    //     const num = stockMark == 1 ? parseInt(item.rate * cycleData.master_total) : parseInt(item.rate * cycleData.spare_total);
    //     coupons.push({
    //       id: item.id,
    //       coupon_name: item.coupon_name,
    //       type_code: item.type_code,
    //       rate: item.rate,
    //       num: num
    //     })
    //   }
    // }
    // return coupons;
  }

  /**
   * 获取奖品
   * @param {*} coupons
   */
  async lottery (coupons) {
    let total = 0;  // 奖品总数
    for (const item of coupons) {
      total += item.num;
    }

    for (let i = 0; i < coupons.length; i++) {
      const random = parseInt(Math.random() * total);       // 获取 0-总数 之间的一个随随机整数
      const num = coupons[i].num;
      if (random < num) {
        return coupons[i]                               // 如果在当前的概率范围内,得到的就是当前概率
      } else {
        total -= num                                    // 否则减去当前的概率范围,进入下一轮循环
      }
    }

    // console.log(`*******************`)
    // console.log(`抽奖程序出问题`)
  }

  /**
   * 中奖处理
   * @param {微信openId} openId
   * @param {优惠券奖品信息} coupon
   * @param {第几周期 1,2...} cycle
   * @param {库存标识 1主库存 2备用库存} stockMark
   */
  async hitHandle (openId, coupon = {}, cycle, stockMark) {
    const coupon_code = Generate.id();
    const couponUserModel = this.model('activity_coupon_user')
    // 将获得的优惠券关联到活动账户下，状态为 未领取
    await couponUserModel.add({
      openid: openId,
      coupon_id: coupon.id,
      type_code: coupon.type_code,
      receive_time: null, // 领取时间
      status: 1, // 使用状态(1未使用 2已使用)
      receive_status: 1, // 领取状态(1未领取 2已领取)
      coupon_code: coupon_code,  // 券码(仅用于更新用户所拥有的优惠券)
      cycle: cycle,
      stock_mark: stockMark,
      create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    });

    const ruleRecordModel = this.model('activity_rule_record');
    await ruleRecordModel.add({
      openid: openId,
      coupon_id: coupon.id,
      type_code: coupon.type_code,
      coupon_code: coupon_code,
      cycle: cycle,
      create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    });

    return this.success({
      type: 1,     // 1 优惠券 2 充值卡
      coupon: {
        coupon_code: coupon_code,
        openid: openId,
        coupon_name: coupon.coupon_name,
        type_code: coupon.type_code
      }
    });
  }

  /**
   * 领取会员充值卡
   */
  async receiveCardAction () {
    const data = this.post()
    if (think.isEmpty(data.card_code)) {
      return this.fail(1000, '请求参数错误')
    }
    if (think.isEmpty(data.address)) {
      return this.fail(1001, '地址必须填写')
    }
    if (think.isEmpty(data.recipient_name)) {
      return this.fail(1002, '收件人姓名必须填写')
    }
    if (think.isEmpty(data.phone_number)) {
      return this.fail(1003, '手机号码必须填写')
    }

    const cardUserModel = this.model('activity_card_user');
    const num = await cardUserModel.where('phone_number is not NULL').count('id');
    if(num >= 1000){
      return this.fail(1005, '会员卡超过领取时间')
    }

    const cardUserData = await cardUserModel.where({card_code: data.card_code}).find();
    if (think.isEmpty(cardUserData)) {
      return this.fail(1004, '会员充值卡不存在')
    }

    await cardUserModel.where({
      card_code: data.card_code
    }).update({
      address: data.address,  // 收货地址
      recipient_name: data.recipient_name, // 收件人姓名
      phone_number: data.phone_number, // 手机号码
      receive_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  // 领取时间
    });
    return this.success({
      receive_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  // 领取时间
    })
  }

  /**
   * 领取优惠券
   */
  async receiveCouponAction () {
    const data = this.post()
    // console.log(data)
    if (think.isEmpty(data.coupon_code)) {
      return this.fail(1000, 'code 参数错误')
    }

    const couponUserModel = this.model('activity_coupon_user')
    const couponUserData = await couponUserModel.where({
      coupon_code: data.coupon_code
    }).find();

    if (think.isEmpty(couponUserData)) {
      return this.fail(1003, '优惠券不存在')
    }
    // 验证这个码是否发过了
    if (couponUserData.receive_status === 2) {
      // return this.fail(1004, '已领取')
      return this.success({
        coupon_code: couponUserData.coupon_code,
        crm_coupon_code: couponUserData.crm_coupon_code,
        status: couponUserData.status,
        receive_status: couponUserData.receive_status
      })
    }
    // console.log(couponUserData.openid)
    // 发放优惠劵
    const crmSendCouponRes = await this.sendCouponByActivity(couponUserData.openid, couponUserData.type_code)
    if (crmSendCouponRes.errcode === 0) {
      const crm_coupon_code = crmSendCouponRes.data[0]
      await couponUserModel.where({
        coupon_code: data.coupon_code
      }).update({
        crm_coupon_code,
        receive_status: 2, // 领取状态(1未领取 2已领取)
        receive_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  // 领取时间
      })
      return this.success({
        coupon_code: data.coupon_code,
        crm_coupon_code,
        receive_status: 2
      })
    } else {
      return this.json(crmSendCouponRes)
    }
  }

  /**
   * 调用 CRM 接口进行发劵操作
   * 只用登录成功的用户可以发劵
   * @returns {Promise<void>}
   */
  async sendCouponByActivity (openId, code) {
    // console.log('SEND COUPON ...')
    // http://demo.micvs.com/crmSession/console/api/
    // coupon/
    // sendCouponByActivity?channel=5&deviceDate=2018-04-16 11:50:00&merNo=2109&shopNo=210999999998&deviceNo=210999999998&version=1.0&token=B0A8DB136921E59A6573A3F732FC754C014361DFC5F5F677894765C28C25A5731DEBCE0DE84B5964&orderNo=Li20180416005&transCode=A016&amount=oQJYBw_H_E3FRVj1jsHSHG__AmKQ&type=2&couponJson=[{couponType:584,couponNum:1},{couponType:581,couponNum:2}]

    // console.log(couponUserData.openid)
    // 查询当前 openId 是否为会员账户
    // const account = this.model('account')
    // let accountInfo = await this.model('account')
    //   .loadOrCreate(data)
    const isCardNo = await this.model('account').field(['cardNo']).where({
      openId: openId
    }).find()
    console.warn('会员信息----')
    console.warn(isCardNo)
    if (!think.isEmpty(isCardNo)) {
      const queryConfig = think.config('proxyQueryStringForCoupon')
      const couponJson = [{
        couponType: code,
        couponNum: 1
      }]
      const queryInfo = {
        version: queryConfig.version,
        channel: queryConfig.channel,
        deviceDate: this.moment().format('YYYY-MM-DD HH:mm:ss'),
        merNo: queryConfig.merNo,
        shopNo: queryConfig.shopNo,
        deviceNo: queryConfig.deviceNo,
        token: queryConfig.token,
        orderNo: Generate.id(),
        transCode: queryConfig.transCode,
        // amount: queryConfig.amount,
        amount: openId,
        type: queryConfig.type,
        // TODO 处理卡劵
        // couponJson: JSON.stringify(queryConfig.couponJson)
        couponJson: JSON.stringify(couponJson)
      }
      // console.log('SEND COUPON PARAM ...')
      // console.log(queryInfo)
      const query = queryString.stringify(queryInfo)

      // console.log(query)
      const payload = (await this.got.post(
        '/console/api/coupon/sendCouponByActivity',
        {
          baseUrl: think.config('proxyCrmApi'),
          query
        }
      )).body
      // console.log('SEND COUPON RETURN ...')
      // console.log(payload)
      return JSON.parse(payload)
    } else {
      return this.fail('会员信息不存在')
    }
  }

  /** *****************优惠券数据测试接口****************** */

  /**
   * 初始化当天的数据 用于测试
   */
  async initTodayAction () {
    const couponPoolModel = this.model('activity_coupon_pool');
    // 主库存
    for (let i = 0; i < 10; i++) {
      const release_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      await couponPoolModel.add({
        coupon_id: 1,
        release_time: release_time,
        last_quantity: 1,
        stock_mark: 1  // 库存标识 1主库存 2备用库存
      })
    }
    // 备用库存
    for (let i = 0; i < 10; i++) {
      const release_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      await couponPoolModel.add({
        coupon_id: 1,
        release_time: release_time,
        last_quantity: 1,
        stock_mark: 2  // 库存标识 1主库存 2备用库存
      })
    }

    return this.success()
  }

}
