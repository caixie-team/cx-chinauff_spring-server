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
    // this.key = 'bacd$!#@'; //秘钥
    // this.key = 'chinauffspring2018'; //秘钥 MD5
    // this.key = '09e96454730650a6'
  }

  /**
   * 扫一扫 (福字)
   */
  async scanAction() {
    const data = this.post()
    if (think.isEmpty(data.openId)) {
      return this.fail(1000, '请求参数错误')
    }
    let isHelp = false;
    // 如果是被加密的，进行解密（用于助力时传过来的 beOpenIdproxyCrmApi）
    if (!think.isEmpty(data.encrypt)) {
      data.openId = decrypt(data.openId, this.key);
      isHelp = true;
    }

    //判断openid是否存在
    const chinauffAccountModel = this.model('chinauff_account')
    const chinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
    if (think.isEmpty(chinauffAccount)) {
      return this.fail(1001, '活动账户不存在')
    }

    const blessingUserModel = this.model('activity_blessing_user');
    const fuCount = await blessingUserModel.where({
      openid: data.openId
    }).count('id');
    // console.log(`******** 满福累计: ${fuCount} *******`)
    if(fuCount >= 3){
      //已经够3个福字
      return this.success({
        blessing_type: 0
        // blessing: {}
      })
    }

    const nowDate = moment(new Date()).format('YYYY-MM-DD')
    if (!isHelp) {
      //检测是否有助力
      const helpModel = this.model('activity_help')
      const helpInfo = await helpModel.where({ be_openid: data.openId, status: 1 }).limit(1).find();
      if (think.isEmpty(helpInfo)) { //没有助力
        //是否到达参与限制
        const blessingTimesModel = this.model('activity_blessing_times');
        const times = await blessingTimesModel.where({ join_date: nowDate, openid: data.openId }).count('id');
        if (times >= 3) {
          return this.fail(1002, '今日可参与次数已用完')
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
    }

    const currentDate = moment(new Date()).format('YYYY-MM-DD');
    // console.log(`******** 当前日期: ${currentDate} *******`)
    const cycleData = await this.getCycle(currentDate);
    if (think.isEmpty(cycleData)) { //如果参与集福的时间不在活动范围内，直接返回没有奖品
      return this.success({
        blessing_type: 0
        // blessing: {}
      })
    }

    //判断是否可以集福字
    const ruleModel = this.model('activity_rule');
    const ruleData = await ruleModel.where({
      cycle: cycleData.cycle, //活动周期
      status: 1 //可发福字状态 1可发字 2不可发字 3 已使用
    }).find();
    if (think.isEmpty(ruleData)) {
      // console.log(`********没有集福机会*******`)
      //没集到福字
      return this.success({
        blessing_type: 0
        // blessing: {}
      })
    } else {
      await ruleModel.where({
        id: ruleData.id
      }).update({
        status: 3
      })
    }

    //查询福池是否有奖
    const blessingPoolModel = this.model('activity_blessing_pool');
    let nowTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

    let _sqlWhere = `
        release_time <= '${nowTime}'
        AND last_quantity > 0
        AND DATE_FORMAT(release_time, '%Y-%m-%d') >= '${cycleData.startDate}'
        AND DATE_FORMAT(release_time, '%Y-%m-%d') <= '${cycleData.endDate}'
    `
    const pools = await blessingPoolModel.where(_sqlWhere).limit(1).select();

    if (think.isEmpty(pools)) { //没有字奖品
      return this.success({
        blessing_type: 0
        // blessing: {}
      })
    }
    const updateBlessingPool = await blessingPoolModel.where({
      id: pools[0].id,
      last_quantity: { '>': 0 }
    }).update({ last_quantity: ['exp', 'last_quantity-1'] })
    if (updateBlessingPool <= 0) { //奖品已被别人领走
      return this.success({
        // blessing: {}
        blessing_type: 0
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
      const icon_num = parseInt(Math.random() * 11, 10) + 1;				//1~11的随机数
      const blessing_code = Generate.id();
      await blessingUserModel.add({
        openid: data.openId,
        blessing_code: blessing_code,
        shi_code: records[0].code,
        yi_code: records[1].code,
        kou_code: records[2].code,
        tian_code: records[3].code,
        status: 1,//福码状态(1:待预约 2:待兑换 3:已兑换)
        exchange_time: null,
        create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        update_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        icon_num: icon_num
      })
      for (let item of records) {
        //修改福字记录状态为已合成
        await blessingRecordModel.where({
          id: item.id
        }).update({
          status: 2 //合成福状态(1:未合成 2:已合成)
        })
      }
      blessing_josn.blessing_code = blessing_code;
      blessing_josn.icon_num = icon_num;
      blessing_josn.full = true;
    }
    return this.success(blessing_josn)
  }

  /**
   * 获取周期日期
   * @param {当前日期} currentDate
   */
  async getCycle(currentDate) {
    //第一阶段
    const one_start_date = '2019-01-05';
    const one_end_date = '2019-01-09';

    //第二阶段
    const two_start_date = '2019-01-10';
    const two_end_date = '2019-01-15';

    //第三阶段
    const three_start_date = '2019-01-16';
    const three_end_date = '2019-01-21';

    //第四阶段
    const four_start_date = '2019-01-22';
    const four_end_date = '2019-01-26';

    //第五阶段
    const five_start_date = '2019-01-27';
    const five_end_date = '2019-02-01';

    //第六阶段
    const six_start_date = '2019-02-02';
    const six_end_date = '2019-02-04';

    let data = null;

    if (currentDate >= one_start_date && currentDate <= one_end_date) {//第一周期
      data = {
        startDate: one_start_date,
        endDate: one_end_date,
        cycle: 1
      }
    } else if (currentDate >= two_start_date && currentDate <= two_end_date) {//第二周期
      data = {
        startDate: two_start_date,
        endDate: two_end_date,
        cycle: 2
      }
    } else if (currentDate >= three_start_date && currentDate <= three_end_date) {//第三周期
      data = {
        startDate: three_start_date,
        endDate: three_end_date,
        cycle: 3
      }
    } else if (currentDate >= four_start_date && currentDate <= four_end_date) {//第四周期
      data = {
        startDate: four_start_date,
        endDate: four_end_date,
        cycle: 4
      }
    } else if (currentDate >= five_start_date && currentDate <= five_end_date) {//第五周期
      data = {
        startDate: five_start_date,
        endDate: five_end_date,
        cycle: 5
      }
    } else if (currentDate >= six_start_date && currentDate <= six_end_date) {//第六周期
      data = {
        startDate: six_start_date,
        endDate: six_end_date,
        cycle: 6
      }
    }
    return data;
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
    let pNubmer = 0
    if (think.isEmpty(peopleNumber) && peopleNumber.length > 0) {
      pNubmer = peopleNumber[0].nums
    }
    return this.success({
      peopleNumber: pNubmer,	//集满福的总人数
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
    const beOpenId = decrypt(data.beOpenId, this.key)
    //判断openid是否存在
    const chinauffAccountModel = this.model('chinauff_account')
    const helpChinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
    if (think.isEmpty(helpChinauffAccount)) {
      return this.fail('助力活动账户不存在')
    }

    const beHelpChinauffAccount = await chinauffAccountModel.where({ openId: beOpenId }).find();
    if (think.isEmpty(beHelpChinauffAccount)) {
      return this.fail('被助力活动账户不存在')
    }

    const helpModel = this.model('activity_help');
    //查询活动周期内是否已经助力过
    const helpInfo = await helpModel.where({ openid: data.openId, be_openid: beOpenId }).find();
    if (!think.isEmpty(helpInfo)) {
      return this.fail(1001, '您已助力')
    }

    await helpModel.add({
      // 被助力者
      be_openid: beOpenId,
      // 助力者
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
    const list = await blessingUserModel
      .field('id,openid,blessing_code,status,exchange_time,icon_num, update_time')
      .where({ openid: data.openId }).order('update_time DESC').select();
    return this.success(list);
  }

  /**
   * 预约兑换
   */
  async reserveAction() {
    // console.log('reserver ......')
    let now = new Date().getTime();
    let startTime = new Date('2019-01-05 00:00:00').getTime(); //可提交预约开始时间
    let endTime = new Date('2019-02-01 23:59:59').getTime();//可提交预约结束时间
    if (now < startTime || now > endTime) {
      return this.fail('可提交预约时间:2019年1月5日00:00:00 - 2019年2月1日23:59:59');
    }

    const data = this.post()
    console.log(data)
    //openId
    if (think.isEmpty(data.openId)) {
      return this.fail(1000, '请求参数错误, 没有openId')
    }
    //判断openid是否存在
    const chinauffAccountModel = this.model('chinauff_account')
    const chinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
    if (think.isEmpty(chinauffAccount)) {
      return this.fail(1001, '活动账户不存在')
    }

    //判断福码非空
    if (think.isEmpty(data.blessing_code)) {
      return this.fail(1002, '请求参数错误, 没有福码')
    }
    //校验福码合法性
    const blessingUserModel = this.model('activity_blessing_user')
    const blessingUserInfo = await blessingUserModel.where({ blessing_code: data.blessing_code }).find();
    if (think.isEmpty(blessingUserInfo)) {
      return this.fail(1002, '集福数据不存在')
    }

    //判断预约兑换日期非空
    if (think.isEmpty(data.reserve_date)) {
      return this.fail('请选择距今两天以后的日期')
    }

    const days = (new Date(data.reserve_date) - new Date(new Date())) / 1000 / 60 / 60 / 24
    if (days < 1) {
      return this.fail('请选择距今两天以后的日期')
    }
    //判断门店信息非空
    if (think.isEmpty(data.shop_id)) {
      return this.fail('门店信息错误，请重新选择')
    }

    const reserveModel = this.model('activity_reserve')
    const reserveInfo = await reserveModel.where({
      blessing_code: data.blessing_code,
      status:1
     }).find();
    if (!think.isEmpty(reserveInfo)) {
      return this.fail(1003, '已预约')
    }

    await reserveModel.add({
      shop_id: data.shop_id,
      reserve_date: moment(data.reserve_date).format('YYYY-MM-DD'),
      // reserve_date: new Date(data.reserve_date),
      openid: data.openId,
      blessing_code: data.blessing_code,
      status: 1, //预约状态
      create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    })

    const shopModel = this.model('chinauff_shop')
    //门店的库存数量减1
    await shopModel.where({
      shop_code: data.shop_id,
      num: { '>': 0 }
    }).update({ num: ['exp', 'num-1'] })
    const updateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    //status 福码状态(1:待预约 2:待兑换 3:已兑换)
    const res = await blessingUserModel.where({ blessing_code: data.blessing_code }).update({
      status: 2,
      update_time: updateTime,
    })
    if (res) {
      // return this.fail(1003, '已预约')
      return this.success({
        status: 1, //预约状态
        reserve_date: updateTime
      });
    }
  }

  /**
   * 获取预约信息
   */
  async getReserveAction() {
    const data = this.post()
    //判断福码非空
    if (think.isEmpty(data.blessing_code)) {
      return this.fail('请求参数错误')
    }
    const reserveModel = this.model('activity_reserve')
    let sql = `
			SELECT
				s.shop_name,
				s.shop_code,
				r.blessing_code,
				r.reserve_date
			FROM
				picker_activity_reserve r
					LEFT JOIN
				picker_chinauff_shop s ON r.shop_id = s.shop_code
				where r.blessing_code='${data.blessing_code}' and r.status=1;`;
    const list = await reserveModel.query(sql);
    return this.success(list.length > 0 ? list[0] : {});
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
    if (this.isPost) {
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
        times: helpNum + (3 - times)
      })
    }
  }

  /**
   * 好友助力统计
   */
  async helpsAction() {
    const data = this.post()
    //被助力的openId
    if (think.isEmpty(data.beOpenId)) {
      return this.fail('请求参数错误')
    }
    const beOpenId = decrypt(data.beOpenId, this.key);
    // console.log(beOpenId)
    const helpModel = this.model('activity_help');

    let sql = `
        SELECT 
          a.avatar
        FROM
            spring.picker_activity_help h
                LEFT JOIN
            picker_chinauff_account a ON h.openid = a.openId
        WHERE
            h.be_openid = '${beOpenId}' and a.avatar is not NULL limit 5;`
    const avatars = await helpModel.query(sql);
    let arr = [];
    if (!think.isEmpty(avatars)) {
      for (let item of avatars) {
        arr.push(item.avatar)
      }
    }

    //统计总助力数
    const total = await helpModel.where({
      be_openid: beOpenId
    }).count('id');

    return this.success({
      total: total,
      avatars: arr
    });
  }

  /**
   * 好友助力状态
   */
  async helpStatusAction() {
    const data = this.post();
    //助力者openId
    if (think.isEmpty(data.openId)) {
      return this.fail('请求参数错误')
    }
    //被助力者openId 是加密的
    if (think.isEmpty(data.beOpenId)) {
      return this.fail('请求参数错误')
    }

    //判断openid是否存在
    const chinauffAccountModel = this.model('chinauff_account')
    const helpChinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
    if (think.isEmpty(helpChinauffAccount)) {
      return this.fail('助力活动账户不存在')
    }

    //判断助力者和被助力者是不是同一个人
    const beOpenId = decrypt(data.beOpenId, this.key);
    if (think.isEmpty(data.beOpenId)) {
      return this.fail('被助力活动账户不存在')
    }
    const beHelpChinauffAccount = await chinauffAccountModel.where({ openId: beOpenId }).find();
    if (think.isEmpty(beHelpChinauffAccount)) {
      return this.fail('被助力活动账户不存在')
    }

    let status = 1; //未助力
    // console.log(data.openId)
    // console.log(beOpenId)
    if (data.openId === beOpenId) {
      status = 3;  //同一个人
    } else {
      const helpModel = this.model('activity_help');
      //查询活动周期内是否已经助力过
      const helpInfo = await helpModel.where({ openid: data.openId, be_openid: beOpenId }).find();
      if (!think.isEmpty(helpInfo)) {
        status = 2; //已助力
      } else {
        status = 1; //未助力
      }
    }

    return this.success({
      status: status
    })
  }

  /**
   * 我的充值卡
   *
   */
  async getMyCardAction() {
    const data = this.post();
    //openId
    if (think.isEmpty(data.openId)) {
      return this.fail('请求参数错误')
    }

    const cardUserModel = this.model('activity_card_user')
    let sql = `
      SELECT 
          cu.openid,
          cu.address,
          cu.recipient_name,
          cu.phone_number,
          cu.card_code,
          cu.receive_time,
          c.card_name,
          c.card_type
      FROM
          picker_activity_card_user cu
              LEFT JOIN
          picker_activity_card c ON cu.card_id = c.id
      WHERE
          cu.openid = '${data.openId}';
      `
    let rows = await cardUserModel.query(sql);
    return this.success(rows);
  }
  /**
   * 验证福码有效性
   * @returns {Promise<void>}
   * @private
   */
  async checkCodeAction() {
    const data = this.post()
    if (think.isEmpty(data.blessing_code)) {
      return this.fail()
    }
    const blessingUserModel = this.model('activity_blessing_user')
    const blessingUserInfo = await blessingUserModel.where({ blessing_code: data.blessing_code}).find();
    if (think.isEmpty(blessingUserInfo)) {
      return this.fail(1001, '兑换码无效')
    }
    if (blessingUserInfo.status === 3) {
      return this.fail(1002, '已被兑换')
    }
    return this.success()
  }


  /*******************福字数据测试接口****************** */

  /**
   * 初始化当天的数据 用于测试
   */
  async initTodayAction() {
    if (true) {
      return this.fail('没有需要生成的福字信息')
    }
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
    let date = new Date('2018-12-30 00:00:00');
    date.setDate(date.getDate() + 5)
    const blessingPoolModel = this.model('activity_blessing_pool');
    for (let i = 0; i < blessingArr.length; i++) {
      let release_time = moment(date).format('YYYY-MM-DD HH:mm:ss')
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
      start_date: '2019-02-02', end_date: '2019-02-04', total: { '>': 0 }
    }).select();
    if (!blessings || blessings.length <= 0) {
      return this.fail('没有需要生成的福字信息')
    }
    let bLength = 0;
    let blessingArr = [];
    for (let item of blessings) {
      // console.log(item)
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
    blessingArr = _.shuffle(blessingArr) //打乱数组顺序
    blessingArr = _.shuffle(blessingArr) //打乱数组顺序

    let startTime = new Date('2019-02-02 00:00:00').getTime()
    let endTime = new Date('2019-02-04 23:59:59').getTime()
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
    let t = new Date('2019-02-02 00:00:00').getTime()
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
