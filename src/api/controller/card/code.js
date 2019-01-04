const Base = require('../base')
const moment = require('moment');
const _ = require('lodash');
/**
 * 集福 API
 * @type {module.exports}
 */
module.exports = class extends Base {
  constructor (ctx) {
    super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
    // 其他额外的操作
    this.db = this.model('activity_blessing');
    this.key = 'bacd$!#@'; //秘钥
  }

  /**
   * 获取预约信息
   *
   * @api {post} /api/card/code/get 查询 Code
   * @apiGroup Card
   * @apiDescription 查询 Code 接口
   * @apiName getCode
   * @apiParam {String} blessing_code 福码
   * @apiParamExample {String} 示例福码: blessing_code
   *  mPhkHZgWef4a5Bjsxestt
   * @apiParam {String} shop_code 店铺编号
   * @apiParamExample {String} 示例编号: shop_code
   * 210910010001
   * @apiSuccess {json} result
   * @apiSuccessExample {json} 卡劵状态正常, 可用:
   * {
   *    "errno": 0,
   *    "errmsg": "",
   *    "data": ""
   *}
   * @apiError {json}   1000 请求参数错误
   * @apiErrorExample {json} Error-1000:
   * {
   * "errno": 1000,
   * "errmsg": "请求参数错误"
   * }
   * @apiError {json}   1001 兑换码无效
   * @apiErrorExample {json} Error-10001:
   * {
   * "errno": 1001,
   * "errmsg": "兑换码无效"
   * }
   * @apiError {json}   1002 已被兑换
   * @apiErrorExample {json} Error-1002:
   * {
   * "errno": 1002,
   * "errmsg": "已被兑换"
   * }
   * @apiError {json}   1003 未预约
   * @apiErrorExample {json} Error-1003:
   * {
   * "errno": 1003,
   * "errmsg": "未预约"
   * }
   * @apiError {json}   1004 兑换时间
   * @apiErrorExample {json} Error-1004:
   * {
   * "errno": 1004,
   * "errmsg": "未在可兑换时段"
   * }
   * @apiError {json}   1005 未在可兑换门店
   * @apiErrorExample {json} Error-1005:
   * {
   * "errno": 1005,
   * "errmsg": "未在可兑换门店"
   * }
   * @apiSampleRequest http://spring.chinauff.com/api/card/code/get
   * @apiVersion 1.0.0
   */
  async getAction () {
    // 检查兑换时间 1004
    // return 1004 未在可兑换时段
    await this._checkTime()
    // 检查请求参数
    // return 1000 请求参数错误
    const data = await this._checkParams()
    console.log(data)
    // const data = this.post()
    //判断福码非空
    // if (think.isEmpty(data.blessing_code) || think.isEmpty(data.shop_code)) {
    //   return this.fail('请求参数错误')
    // }

    // 校验福码合法性
    // return 1001 兑换码无效
    // return 1002 已被兑换
    await this._checkCodeStatus(data.blessing_code)

    // 预约兑换数据
    // return 1003 未预约
    const reserveInfo = await this._checkReserve(data)

    // const reserveModel = this.model('activity_reserve')
    // const res = await reserveModel.where({
    //   shop_id: data.shop_code,
    //   blessing_code: data.blessing_code,
      // 2 为已取消，只验证已预约的
      // status: 1
    // }).find()
    if (!think.isEmpty(reserveInfo)) {
      return this.success()
    } else {
      return this.fail(1003, '未预约')
    }
  }

  /**
   * 核销
   *
   * @api {post} /api/card/code/consume 核销
   * @apiGroup Card
   * @apiName Consume
   * @apiParam {String} blessing_code 福码
   * @apiParamExample {String} 示例福码: blessing_code
   *  mPhkHZgWef4a5Bjsxestt
   * @apiParam {String} shop_code 店铺编号
   * @apiParamExample {String} 示例编号: shop_code
   * 210910010001
   * @apiSuccess {json} result
   * @apiSuccessExample {json} 核销兑换成功:
   * {
   *    "errno": 0,
   *    "errmsg": "",
   *    "data": "兑换成功"
   *}
   * @apiError {json}   1000 请求参数错误
   * @apiErrorExample {json} Error-1000:
   * {
   * "errno": 1000,
   * "errmsg": "请求参数错误"
   * }
   * @apiError {json}   1001 兑换码无效
   * @apiErrorExample {json} Error-10001:
   * {
   * "errno": 1001,
   * "errmsg": "兑换码无效"
   * }
   * @apiError {json}   1002 已被兑换
   * @apiErrorExample {json} Error-1002:
   * {
   * "errno": 1002,
   * "errmsg": "已被兑换"
   * }
   * @apiError {json}   1003 未预约
   * @apiErrorExample {json} Error-1003:
   * {
   * "errno": 1003,
   * "errmsg": "未预约"
   * }
   * @apiError {json}   1004 兑换时间
   * @apiErrorExample {json} Error-1004:
   * {
   * "errno": 1004,
   * "errmsg": "未在可兑换时段"
   * }
   * @apiSampleRequest http://spring.chinauff.com/api/card/code/consume
   * @apiVersion 1.0.0
   */
  async consumeAction () {
    // 检查兑换时间 1004
    // return 1004 未在可兑换时段
    // await this._checkTime()

    // 检查请求参数
    // return 1000 请求参数错误
    const data = await this._checkParams()

    // 校验福码合法性
    // return 1001 兑换码无效
    // return 1002 已被兑换
    await this._checkCodeStatus(data.blessing_code)

    // 预约兑换数据
    // return 1003 未预约
    const reserveInfo = await this._checkReserve(data)

    //更新福码为已兑换状态
    await this.model('activity_blessing_user').where({blessing_code: data.blessing_code}).update({
      status: 3, //已兑换
      exchange_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  //兑换时间
    });

    //兑换数据记录
    const exchangeModel = this.model('activity_exchange')
    await exchangeModel.add({
      shop_id: reserveInfo.shop_id,
      openid: reserveInfo.openid,
      blessing_code: reserveInfo.blessing_code,
      create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    });

    return this.success('兑换成功');
  }

  /**
   * 验证请求参数
   * @returns {Promise<*>}
   * @private
   */
  async _checkParams () {
    const data = this.post()
    if (think.isEmpty(data.blessing_code) || think.isEmpty(data.shop_code)) {
      return this.fail(1000, '请求参数错误')
      // return this.fail('请求参数错误')
    }
    //判断福码非空
    // if (think.isEmpty(data.blessing_code)) {
    //   return this.fail(1000, '请求参数错误')
    // }
    return data
  }

  /**
   * 验证预约状态
   * @returns {Promise<void>}
   * @private
   */
  async _checkReserve (data) {
    //预约兑换数据
    const reserveModel = this.model('activity_reserve')
    const reserveInfo = await reserveModel.where({
      blessing_code: data.blessing_code,
      status: 1
    }).find();
    if (think.isEmpty(reserveInfo)) {
      return this.fail(1003, '未预约')
    }
    if (reserveInfo.shop_id !== data.shop_code) {
      return this.fail(1005, '未在可兑换门店')
    }

    return reserveInfo
  }

  // const reserveModel = this.model('activity_reserve')
  // const res = await reserveModel.where({
  //   shop_id: data.shop_code,
  //   blessing_code: data.blessing_code,
  //   2 为已取消，只验证已预约的
  // status: 1
  // }).find()
  /**
   * 验证福码有效性
   * @returns {Promise<void>}
   * @private
   */
  async _checkCodeStatus (blessing_code) {
    const blessingUserModel = this.model('activity_blessing_user')
    const blessingUserInfo = await blessingUserModel.where({blessing_code: blessing_code}).find();
    if (think.isEmpty(blessingUserInfo)) {
      return this.fail(1001, '兑换码无效')
    }
    if (blessingUserInfo.status === 3) {
      return this.fail(1002, '已被兑换')
    }
  }

  async _checkTime () {
    let now = new Date().getTime();
    // let startTime = new Date('2019-01-05 00:00:00').getTime(); //可到店兑换开始时间
    // let startTime = new Date('2019-01-05 00:00:00').getTime(); //可提交预约开始时间
    // TODO 上线前测试时间
    let startTime = new Date('2019-01-04 00:00:00').getTime(); //可提交预约开始时间
    let endTime = new Date('2019-02-04 13:59:59').getTime();//可到店兑换结束时间
    if (now < startTime || now > endTime) {
      return this.fail(1004, '未在可兑换时间段');
    }
  }
}
