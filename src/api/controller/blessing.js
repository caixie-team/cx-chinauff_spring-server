const Base = require('./base')
const moment = require('moment');
const _ = require('lodash');
/**
 * 集福 API
 * @type {module.exports}
 */
module.exports = class extends Base {
	constructor(ctx) {
		super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
		// 其他额外的操作
		this.db = this.model('activity_blessing');
		this.key = 'bacd$!#@'; //秘钥
	}

	/**
	 * 扫一扫 (福字)
	 */
	async scanAction() {
		const data = this.post()
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}

		//判断openid是否存在
		const chinauffAccountModel = this.model('chinauff_account')
		const chinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
		if (think.isEmpty(chinauffAccount)) {
			return this.fail('活动账户不存在')
		}

		const nowDate = moment(new Date()).format('YYYY-MM-DD')
		//检测是否有助力
		const helpModel = this.model('activity_help')
		const helpInfo = await helpModel.where({ be_openid: data.openId, status: 1 }).limit(1).find();

		if (think.isEmpty(helpInfo)) { //没有助力
			//是否到达参与限制
			const blessingTimesModel = this.model('activity_blessing_times');
			const times = await blessingTimesModel.where({ join_date: nowDate, openid: data.openId }).count('id');
			if (times >= 3) {
				return this.fail(3, '今日可参与次数已用完')
			} else {
				//记录参与一次
				await blessingTimesModel.add({
					openid: data.openId,
					join_date: nowDate
				});
			}
		} else { //有助力
			await helpModel.where({ id: helpInfo.id }).update({
				status: 2 	//助力已使用
			})
		}

		//查询福池是否有奖
		const blessingPoolModel = this.model('activity_blessing_pool');
		let nowTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		const pools = await blessingPoolModel.where({ release_time: { '<=': nowTime }, last_quantity: { '>': 0 } }).limit(1).select();
		if (think.isEmpty(pools)) { //没有字奖品
			return this.success({
				blessing: {}
			})
		}

		const updateBlessingPool = await blessingPoolModel.where({ id: pools[0].id, last_quantity: { '>': 0 } }).update({ last_quantity: ['exp', 'last_quantity-1'] })
		if (updateBlessingPool <= 0) { //奖品已被别人领走
			return this.success({
				blessing: {}
			})
		}

		//中奖,将奖品(字)存入对应的openid名下
		const blessingRecordModel = this.model('activity_blessing_record');
		await blessingRecordModel.add({
			openid: data.openId,
			blessing_type: pools[0].blessing_type,
			blessing_id: pools[0].blessing_id,
			code: pools[0].code,
			hit_time: nowTime,		//抽奖时间作为中奖时间
			status: 1,//合成福状态(1:未合成 2:已合成)
			create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		})

		//返回给前端的响应字符串
		let blessing_josn = {
			name: pools[0].name,
			blessing_type: pools[0].blessing_type,
			full: false
		}

		//判断集到的福字有没有集满
		const records = await blessingRecordModel.field('id,blessing_type,code').where({
			openid: data.openId,
			status: 1
		}).group('blessing_type').order('blessing_type').select();

		if (!think.isEmpty(records) && records.length === 4) {//集满福
			//生成福码
			const blessingUserModel = this.model('activity_blessing_user');
			await blessingUserModel.add({
				openid: data.openId,
				blessing_code: Generate.id(),
				shi_code: records[0].code,
				yi_code: records[1].code,
				kou_code: records[2].code,
				tian_code: records[3].code,
				status: 1,//福码状态(1:待预约 2:待兑换 3:已兑换)
				exchange_time: null,
				create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
				icon_num: parseInt(Math.random() * 11, 10) + 1 				//1~11的随机数
			})
			for (let item of records) {
				//修改福字记录状态为已合成
				await blessingRecordModel.where({
					id: item.id
				}).update({
					status: 2 //合成福状态(1:未合成 2:已合成)
				})
			}
			blessing_josn.full = true;
		}
		return this.success({
			blessing: blessing_josn
		})
	}

	/**
	 * 获取集福统计(集满福的人数,我的集满福个数)
	 */
	async blessingStatisticsAction() {
		const data = this.post()
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const blessingUserModel = this.model('activity_blessing_user');
		const sql = `
		SELECT 
			SUM(repeat_count) as nums
		FROM
			(SELECT 
				COUNT(DISTINCT openid) AS repeat_count
			FROM
				picker_activity_blessing_user
			GROUP BY openid) AS t
		`
		const peopleNumber = await blessingUserModel.query(sql)
		const myblessingNumber = await blessingUserModel.where({ openid: data.openId }).count('id');
		return this.success({
			peopleNumber: peopleNumber[0].nums,	//集满福的总人数
			myblessingNumber: myblessingNumber	//我的集满福个数
		})
	}

	/**
	 * openId 加密
	 */
	async encryptAction() {
		const data = this.post();
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const openId = encrypt(data.openId, this.key)
		return this.success({
			openId: openId
		})
	}

	/**
	 * openid 解密
	 */
	async decryptAction() {
		const data = this.post();
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const openId = decrypt(data.openId, this.key)
		return this.success({
			openId: openId
		});
	}

	/**
	 * 好友助力
	 */
	async helpAction() {
		const data = this.post();
		//助力者openId
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		//被助力者openId
		if (think.isEmpty(data.beOpenId)) {
			return this.fail('请求参数错误')
		}

		//判断openid是否存在
		const chinauffAccountModel = this.model('chinauff_account')
		const helpChinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
		if (think.isEmpty(helpChinauffAccount)) {
			return this.fail('助力活动账户不存在')
		}

		const beHelpChinauffAccount = await chinauffAccountModel.where({ openId: data.beOpenId }).find();
		if (think.isEmpty(beHelpChinauffAccount)) {
			return this.fail('被助力活动账户不存在')
		}

		const helpModel = this.model('activity_help');
		//查询活动周期内是否已经助力过
		const helpInfo = await helpModel.where({ openid: data.openId, be_openid: data.beOpenId }).find();
		if (!think.isEmpty(helpInfo)) {
			return this.fail(1001, '您已助力')
		}

		await helpModel.add({
			be_openid: data.beOpenId,
			openid: data.openId,
			status: 1,	//助力使用状态 1未使用 , 2已使用
			create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		})
		return this.success();
	}

	/**
	 * 我集到的福
	 */
	async myAction() {
		const data = this.post();
		//openId
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const blessingUserModel = this.model('activity_blessing_user')
		const list = await blessingUserModel.field('id,openid,blessing_code,status,exchange_time,icon_num').where({ openid: data.openId }).select();
		return this.success(list);
	}

	/**
	 * 预约兑换
	 */
	async reserveAction() {
		const data = this.post()
		//openId
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		//判断openid是否存在
		const chinauffAccountModel = this.model('chinauff_account')
		const chinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
		if (think.isEmpty(chinauffAccount)) {
			return this.fail('活动账户不存在')
		}

		//判断福码非空
		if (think.isEmpty(data.blessing_code)) {
			return this.fail('请求参数错误')
		}
		//校验福码合法性
		const blessingUserModel = this.model('activity_blessing_user')
		const blessingUserInfo = await blessingUserModel.where({ blessing_code: data.blessing_code }).find();
		if (think.isEmpty(blessingUserInfo)) {
			return this.fail('集福数据不存在')
		}

		//判断预约兑换日期非空
		if (think.isEmpty(data.reserve_date)) {
			return this.fail('请求参数错误')
		}

		//判断门店信息非空
		if (think.isEmpty(data.shop)) {
			return this.fail('请求参数错误')
		}

		const reserveModel = this.model('activity_reserve')
		const reserveInfo = await reserveModel.where({ blessing_code: data.blessing_code }).find();
		if (!think.isEmpty(reserveInfo)) {
			return this.fail('已预约')
		}

		await reserveModel.add({
			shop: data.shop,
			reserve_date: data.reserve_date,
			openid: data.openId,
			blessing_code: data.blessing_code,
			status: 1, //预约状态
			create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		})

		//status 福码状态(1:待预约 2:待兑换 3:已兑换)
		await blessingUserModel.where({ blessing_code: data.blessing_code }).update({
			status: 2
		})
		return this.success();
	}

	/**
	 * 获取单个预约兑换记录
	 */
	async getOneReserveAction() {
		const data = this.post()
		//openId
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		//判断福码非空
		if (think.isEmpty(data.blessing_code)) {
			return this.fail('请求参数错误')
		}
		const reserveModel = this.model('activity_reserve')
		const reserveInfo = await reserveModel.where({ openid: data.openId, blessing_code: data.blessing_code }).find();
		return this.success(reserveInfo);
	}

  /**
	 * 核销
	 *
   * @api {post} /api/consume 核销接口
	 * @apiGroup blessing
   * @apiDescription 核销接口
   * @apiName Consume
	 * @apiParam {String} blessing_code 福码
	 * @apiParamExample {String} 测试福码: blessing_code
	 *  mPhkHZgWef4a5Bjsxestt
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
   * @apiSampleRequest http://spring.chinauff.com/api/consume
   * @apiVersion 1.0.0
   */
	async consumeAction() {
		const data = this.post()
		//判断福码非空
		if (think.isEmpty(data.blessing_code)) {
			return this.fail(1000, '请求参数错误')
		}

		//校验福码合法性
		const blessingUserModel = this.model('activity_blessing_user')
		const blessingUserInfo = await blessingUserModel.where({ blessing_code: data.blessing_code }).find();
		if (think.isEmpty(blessingUserInfo)) {
			return this.fail(1001, '兑换码无效')
		}
		if (blessingUserInfo.status === 3) {
			return this.fail(1002, '已被兑换')
		}

		//预约兑换数据
		const reserveModel = this.model('activity_reserve')
		const reserveInfo = await reserveModel.where({ blessing_code: data.blessing_code }).find();
		if (think.isEmpty(reserveInfo)) {
			return this.fail(1003, '未预约')
		}

		//更新福码为已兑换状态
		await blessingUserModel.where({ blessing_code: data.blessing_code }).update({
			status: 3, //已兑换
			exchange_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  //兑换时间
		});

		//兑换数据记录
		const exchangeModel = this.model('activity_exchange')
		await exchangeModel.add({
			shop: reserveInfo.shop,
			openid: reserveInfo.openid,
			blessing_code: reserveInfo.blessing_code,
			create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		});

		return this.success('兑换成功');
	}

	/**
	 * 获取单个集福信息
	 */
	async getOneAction() {
		const data = this.post()
		//判断福码非空
		if (think.isEmpty(data.blessing_code)) {
			return this.fail('请求参数错误')
		}
		const blessingUserModel = this.model('activity_blessing_user')
		const blessingUserInfo = await blessingUserModel.where({ blessing_code: data.blessing_code }).find();
		return this.success(blessingUserInfo);
	}

	/**
	 * 获取领取的福字记录(统计获取到的各个字的记录)
	 */
	async recordsAction() {
		const data = this.post()
		//openId
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const recordModel = this.model('activity_blessing_record')
		let sql = `
		SELECT 
			blessing_type, COUNT(blessing_type) as num
		FROM
			spring.picker_activity_blessing_record
		WHERE
			openid = '${data.openId}'
				AND status = 1
		GROUP BY blessing_type ORDER BY blessing_type ASC;`
		const records = await recordModel.query(sql);
		return this.success(records);
	}

	/**
	 * 获取今日参与次数
	 */
	async timesAction() {
		const data = this.post()
		//openId
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const helpModel = this.model('activity_help')
		//status 助力使用状态(1 未使用 2已使用)
		const helpNum = await helpModel.where({ be_openid: data.openId, status: 1 }).count('id');

		const nowDate = moment(new Date()).format('YYYY-MM-DD')
		//获取今日已参与次数
		const blessingTimesModel = this.model('activity_blessing_times');
		const times = await blessingTimesModel.where({ join_date: nowDate, openid: data.openId }).count('id');
		return this.success({
			num: helpNum + (3 - times)
		})
	}
	/*******************福字数据测试接口****************** */

	/**
	 * 初始化当天的数据 用于测试
	 */
	async initTodayAction() {
		let blessingArr = [];
		for (let i = 0; i < 100; i++) {
			if ((i % 4 + 1) === 1) {
				blessingArr.push({
					id: 1,
					name: '礻',
					blessing_type: 1,
					code: Generate.id()
				})
			} else if ((i % 4 + 1) === 2) {
				blessingArr.push({
					id: 2,
					name: '一',
					blessing_type: 2,
					code: Generate.id()
				})
			} else if ((i % 4 + 1) === 3) {
				blessingArr.push({
					id: 3,
					name: '口',
					blessing_type: 3,
					code: Generate.id()
				})
			} else if ((i % 4 + 1) === 4) {
				blessingArr.push({
					id: 4,
					name: '田',
					blessing_type: 4,
					code: Generate.id()
				})
			}
		}

		blessingArr = _.shuffle(blessingArr) //打乱数组顺序
		blessingArr = _.shuffle(blessingArr) //打乱数组顺序

		const blessingPoolModel = this.model('activity_blessing_pool');
		for (let i = 0; i < blessingArr.length; i++) {
			let release_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
			const blessingInfo = blessingArr[i]
			await blessingPoolModel.add({
				name: blessingInfo.name,
				blessing_type: blessingInfo.blessing_type,
				blessing_id: blessingInfo.id,
				release_time: release_time,
				last_quantity: 1,
				code: blessingInfo.code
			})
		}
		return this.success()
	}

	async initAction() {

		if (true) {
			return this.fail('没有需要生成的福字信息')
		}

		//获取需要生成的福字信息
		const blessings = await this.db.where({
			start_date: '2019-01-05', end_date: '2019-01-09', total: { '>': 0 }
		}).select();
		if (!blessings || blessings.length <= 0) {
			return this.fail('没有需要生成的福字信息')
		}
		let bLength = 0;
		let blessingArr = [];
		for (let item of blessings) {
			console.log(item)
			bLength += item.total;

			for (let i = 0; i < item.total; i++) {
				blessingArr.push({
					id: item.id,
					name: item.name,
					blessing_type: item.blessing_type,
					code: Generate.id()
				})
			}
		}

		blessingArr = _.shuffle(blessingArr) //打乱数组顺序

		let startTime = new Date('2019-01-05 00:00:00').getTime()
		let endTime = new Date('2019-01-09 23:59:59').getTime()
		let time = endTime - startTime;
		let n = time;
		let m = bLength;
		let average = Math.floor(n / m); // average >= 1
		let max = 0;
		let left = n;
		let arr = [];
		for (let i = 0; i < m; i++) {
			// 这里是关键，每次随机得到一个大于0的值，但必须确保余下的数足够剩下的元素分配
			// 一开始我使用的是 Math.random() * (left - (m - i - 1))，但是效果不好
			// 会导致随机性很差，大数都集中在前面的元素中，而后面的元素往往都是1
			// 这是由于最初的算法在开始时的随机空间很大，所以也容易得到较大的数的原因，而越到后面，剩下的可分配的值越小
			// 后来我改进了算法，加了一个average，用来平均每次的随机空间，测试下来效果挺不错
			arr[i] = i == m - 1 ? left
				: Math.floor(Math.random() * (left - (m - i - 1) * average)) + 1;
			left -= arr[i];
			if (arr[i] > arr[max]) {
				max = i;
			} else if (arr[i] == arr[max] && arr[i] >= average) { // 这里用来修正最大值，确保最大值的元素只有一个
				arr[i]--;
				arr[max]++;
			}
		}

		const blessingPoolModel = this.model('activity_blessing_pool');
		let t = new Date('2019-01-05 00:00:00').getTime()
		for (let i = 0; i < arr.length; i++) {
			t = t + arr[i];
			let tempTime = new Date()
			tempTime.setTime(t)
			let release_time = moment(tempTime).format('YYYY-MM-DD HH:mm:ss')

			const blessingInfo = blessingArr[i]
			await blessingPoolModel.add({
				name: blessingInfo.name,
				blessing_type: blessingInfo.blessing_type,
				blessing_id: blessingInfo.id,
				release_time: release_time,
				last_quantity: 1,
				code: blessingInfo.code
			})
		}
		return this.success(blessingArr)
	}
}

