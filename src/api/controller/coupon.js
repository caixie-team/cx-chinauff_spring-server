const Base = require('./base')
const moment = require('moment');
const _ = require('lodash');
/**
 * 优惠券 API
 * @type {module.exports}
 */
module.exports = class extends Base {
	constructor(ctx) {
		super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
		// 其他额外的操作
		this.db = this.model('activity_coupon');
		this.key = 'bacd$!#@'; //秘钥
    }


}