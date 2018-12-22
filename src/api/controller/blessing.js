const Base = require('./base')
const moment = require('moment');
const _ = require('lodash');
/**
 * 用户 API
 * @type {module.exports}
 */
module.exports = class extends Base {
	constructor(ctx) {
		super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
		// 其他额外的操作
		this.db = this.model('activity_blessing');
	}

	/**
	 * 扫一扫 (福字)
	 */
	async scanAction() {
		const data = this.post()
		if (think.isEmpty(data.openId)) {
			return this.fail('请求参数错误')
		}
		const nowDate = moment(new Date()).format('YYYY-MM-DD')
		console.log(nowDate)

		//是否到达参与限制
		// const blessingTimesModel = this.model('activity_blessing_times');
		// const times = await blessingTimesModel.where({ join_date: nowDate, openid: data.openId }).count('id');
		// if (times >= 3) {
		// 	return this.fail(3, '今日可参与次数已用完')
		// }

		//判断openid是否存在
		const chinauffAccountModel = this.model('chinauff_account')
		const chinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
		if (think.isEmpty(chinauffAccount)) {
			return this.fail('活动账户不存在')
		}

		//记录参与一次
		// await blessingTimesModel.add({
		// 	openid: data.openId,
		// 	join_date:nowDate
		// });

		//查询福池是否有奖
		const blessingPoolModel = this.model('activity_blessing_pool');
		let nDate = new Date()
		//TODO ............................
		/****************上线的时候需要把这句话删除*************** */
		nDate.setDate(nDate.getDate() + 14)
		console.log(nDate)

		let nowTime = moment(nDate).format('YYYY-MM-DD HH:mm:ss')
		const pools = await blessingPoolModel.where({ release_time: { '<=': nowTime }, last_quantity: { '>': 0 } }).limit(1).select();
		console.log(pools)
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
			full:false
		}

		//判断集到的福字有没有集满
		const records = await blessingRecordModel.field('id,blessing_type,code').where({
			openid: data.openId,
			status: 1
		}).group('blessing_type').order('blessing_type').select();
		console.log(records)

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
				create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
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

