const moment = require('moment');
const xlsx = require('node-xlsx');
/**
 * 后台 集福接口
 */
module.exports = class extends think.common.Admin {
  constructor (ctx) {
    super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
  }

  /**
   * 预约管理
   */
  async reserveAction () {
    const data = this.post()
    let page = this.get('page')
    const reserveModel = this.model('activity_reserve');
    let where = {}
    if (!think.isEmpty(data.name)) {
      where[`a.name`] = data.name;
    }
    if (!think.isEmpty(data.mobile)) {
      where[`a.mobile`] = data.mobile;
    }
    if (!think.isEmpty(data.reserve_date)) {
      where[`r.reserve_date`] = data.reserve_date;
    }
    if (!think.isEmpty(data.shop_name)) {
      where[`s.shop_name`] = data.shop_name;
    }
    if (!think.isEmpty(data.status)) {
      where[`b.status`] = data.status;
    }
    const res = await reserveModel.alias('r').field(`r.id,r.reserve_date,r.create_time,r.status as 'reserve_status',s.shop_name,s.shop_code,a.name,a.mobile,b.status,b.exchange_time`)
      .join({
        table: 'chinauff_shop',
        join: 'left',
        as: 's',
        on: ['shop_id', 'shop_code']
      }).join({
        table: 'chinauff_account',
        join: 'left',
        as: 'a',
        on: ['openid', 'openId']
      }).join({
        table: 'activity_blessing_user',
        join: 'left',
        as: 'b',
        on: ['blessing_code', 'blessing_code']
      }).page(page, 20).where(where).countSelect();

    if (!think.isEmpty(res.data)) {
      for (let item of res.data) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日 HH:mm:ss')
        item.reserve_date = moment(new Date(item.reserve_date)).format('YYYY年MM月DD日')
        switch (item.reserve_status) {
          case 1:
            item.reserve_status_label = '正常';
            break;
          case 2:
            item.reserve_status_label = '已取消';
            break;
          default:
            item.reserve_status_label = '';
            break;
        }
        switch (item.status) {
          case 2:
            item.status_label = '未兑换';
            break;
          case 3:
            item.status_label = '已兑换';
            break;
          default:
            item.status_label = '';
            break;

        }
      }
    }
    const html = this.pagination(res);
    this.assign('pagerData', html); //分页展示使用
    this.assign('list', res.data);
    this.assign('data', data);
    return this.display()
  }

  /**
   * 导出预约管理信息
   */
  async exportReserveAction () {
    const data = this.post()
    const reserveModel = this.model('activity_reserve');
    let where = {}
    if (!think.isEmpty(data.name)) {
      where[`a.name`] = data.name;
    }
    if (!think.isEmpty(data.mobile)) {
      where[`a.mobile`] = data.mobile;
    }
    if (!think.isEmpty(data.reserve_date)) {
      where[`r.reserve_date`] = data.reserve_date;
    }
    if (!think.isEmpty(data.shop_name)) {
      where[`s.shop_name`] = data.shop_name;
    }
    if (!think.isEmpty(data.status)) {
      where[`b.status`] = data.status;
    }
    const list = await reserveModel.alias('r').field(`r.id,r.reserve_date,r.create_time,r.status as 'reserve_status',s.shop_name,s.shop_code,a.name,a.mobile,b.status,b.exchange_time`)
      .join({
        table: 'chinauff_shop',
        join: 'left',
        as: 's',
        on: ['shop_id', 'shop_code']
      }).join({
        table: 'chinauff_account',
        join: 'left',
        as: 'a',
        on: ['openid', 'openId']
      }).join({
        table: 'activity_blessing_user',
        join: 'left',
        as: 'b',
        on: ['blessing_code', 'blessing_code']
      }).where(where).select();

    if (!think.isEmpty(list)) {
      for (let item of list) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日 HH:mm:ss')
        item.reserve_date = moment(new Date(item.reserve_date)).format('YYYY年MM月DD日')
        switch (item.reserve_status) {
          case 1:
            item.reserve_status_label = '正常';
            break;
          case 2:
            item.reserve_status_label = '已取消';
            break;
        }
        switch (item.status) {
          case 2:
            item.status_label = '未兑换';
            break;
          case 3:
            item.status_label = '已兑换';
            break;
        }
      }
    }
    let datas = [
      {
        name: '预约管理',
        data: [
          [
            '提交时间',
            '预约兑换时间',
            '预约兑换门店',
            '用户名',
            '手机号码',
            '兑换状态',
            '预约状态'
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (const item of list) {
        datas[0].data.push([
          item.create_time,
          item.reserve_date,
          item.shop_name,
          item.name,
          item.mobile,
          item.status_label,
          item.reserve_status_label
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=reserve.xlsx");
    this.ctx.body = buffer;
  }

  /**
   * 取消预约
   */
  async cancelReserveAction () {
    const data = this.get();
    if (think.isEmpty(data.id)) {
      return this.fail('请求参数错误')
    }

    const reserveModel = this.model('activity_reserve');
    const reserveInfo = await reserveModel.where({
      id: data.id
    }).find();
    if (think.isEmpty(reserveInfo)) {
      return this.fail('信息不存在')
    }

    await reserveModel.where({
      id: data.id
    }).update({
      status: 2
    });

    const blessingUserModel = this.model('activity_blessing_user');
    await blessingUserModel.where({
      blessing_code: reserveInfo.blessing_code
    }).update({
      status: 1
    });

    return this.redirect('/admin/blessing/reserve')
  }

  /**
   * 兑换数据
   */
  async exchangeAction () {
    const data = this.post()
    let _where = '1=1';
    if (!think.isEmpty(data.name)) {
      _where += ` and a.name = '${data.name}' `;
    }
    if (!think.isEmpty(data.mobile)) {
      _where += ` and a.mobile = '${data.mobile}' `;
    }
    if (!think.isEmpty(data.create_time)) {
      _where += ` and DATE_FORMAT(c.create_time, '%Y-%m-%d') = '${data.create_time}' `;
    }
    if (!think.isEmpty(data.shop_name)) {
      _where += ` and s.shop_name = '${data.shop_name}' `;
    }

    let page = this.get('page')
    const exchangeModel = this.model('activity_exchange');
    const res = await exchangeModel.alias('c').field(`c.id,c.create_time,s.shop_name,s.shop_code,a.name,a.mobile`)
      .join({
        table: 'chinauff_shop',
        join: 'left',
        as: 's',
        on: ['shop_id', 'shop_code']
      }).join({
        table: 'chinauff_account',
        join: 'left',
        as: 'a',
        on: ['openid', 'openId']
      }).page(page, 20).where(_where).countSelect();

    if (!think.isEmpty(res.data)) {
      for (let item of res.data) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日 HH:mm:ss')
      }
    }
    const html = this.pagination(res);
    this.assign('pagerData', html); //分页展示使用
    this.assign('list', res.data);
    this.assign('data', data);
    return this.display()
  }

  /**
   * 兑换数据导出
   */
  async exportExchangeAction () {
    const data = this.post()
    let _where = '1=1';
    if (!think.isEmpty(data.name)) {
      _where += ` and a.name = '${data.name}' `;
    }
    if (!think.isEmpty(data.mobile)) {
      _where += ` and a.mobile = '${data.mobile}' `;
    }
    if (!think.isEmpty(data.create_time)) {
      _where += ` and DATE_FORMAT(c.create_time, '%Y-%m-%d') = '${data.create_time}' `;
    }
    if (!think.isEmpty(data.shop_name)) {
      _where += ` and s.shop_name = '${data.shop_name}' `;
    }
    const exchangeModel = this.model('activity_exchange');
    const list = await exchangeModel.alias('c').field(`c.id,c.create_time,s.shop_name,s.shop_code,a.name,a.mobile`)
      .join({
        table: 'chinauff_shop',
        join: 'left',
        as: 's',
        on: ['shop_id', 'shop_code']
      }).join({
        table: 'chinauff_account',
        join: 'left',
        as: 'a',
        on: ['openid', 'openId']
      }).where(_where).select();

    let datas = [
      {
        name: '兑换数据',
        data: [
          [
            '核销兑换时间',
            '核销兑换门店',
            '用户名',
            '手机号码'
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (let item of list) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日 HH:mm:ss')
        datas[0].data.push([
          item.create_time,
          item.shop_name,
          item.name,
          item.mobile
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=exchange.xlsx");
    this.ctx.body = buffer;
  }


  /**
   * 福字数据
   */
  async fuziAction () {
    const data = this.post();
    let whereSql = ' 1=1 '
    if (!think.isEmpty(data.create_time)) {
      whereSql += ` and DATE_FORMAT(br.create_time, '%Y-%m-%d') = '${data.create_time}' `
    }
    const sql = `
                SELECT 
                DATE_FORMAT(br.create_time, '%Y-%m-%d') AS create_time,
                COUNT(br.blessing_type = 1 OR NULL) AS shiCount,
                COUNT(br.blessing_type = 2 OR NULL) AS yiCount,
                COUNT(br.blessing_type = 3 OR NULL) AS kouCount,
                COUNT(br.blessing_type = 4 OR NULL) AS tianCount,
                (SELECT 
                        COUNT(bu.id)
                    FROM
                        picker_activity_blessing_user bu
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bu.create_time, '%Y-%m-%d')) AS fuCount,
                (SELECT 
                        COUNT(bp.blessing_type = 1 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS shiNum,
                (SELECT 
                        COUNT(bp.blessing_type = 2 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS yiNum,
                (SELECT 
                        COUNT(bp.blessing_type = 3 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS kouNum,
                (SELECT 
                        COUNT(bp.blessing_type = 4 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS tianNum
            FROM
                picker_activity_blessing_record br where ${whereSql}
            GROUP BY DATE_FORMAT(br.create_time, '%Y-%m-%d');
                `

    const blessingRecordModel = this.model('activity_blessing_record');
    const list = await blessingRecordModel.query(sql);
    if (!think.isEmpty(list)) {
      for (let item of list) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日')
      }
    }
    this.assign('list', list);
    this.assign('data', data);
    return this.display()
  }

  /**
   * 导出福字数据
   */
  async exportFuziAction () {
    const data = this.post();
    let whereSql = ' 1=1 '
    if (!think.isEmpty(data.create_time)) {
      whereSql += ` and DATE_FORMAT(br.create_time, '%Y-%m-%d') = '${data.create_time}' `
    }
    const sql = `
                SELECT 
                DATE_FORMAT(br.create_time, '%Y-%m-%d') AS create_time,
                COUNT(br.blessing_type = 1 OR NULL) AS shiCount,
                COUNT(br.blessing_type = 2 OR NULL) AS yiCount,
                COUNT(br.blessing_type = 3 OR NULL) AS kouCount,
                COUNT(br.blessing_type = 4 OR NULL) AS tianCount,
                (SELECT 
                        COUNT(bu.id)
                    FROM
                        picker_activity_blessing_user bu
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bu.create_time, '%Y-%m-%d')) AS fuCount,
                (SELECT 
                        COUNT(bp.blessing_type = 1 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS shiNum,
                (SELECT 
                        COUNT(bp.blessing_type = 2 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS yiNum,
                (SELECT 
                        COUNT(bp.blessing_type = 3 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS kouNum,
                (SELECT 
                        COUNT(bp.blessing_type = 4 OR NULL)
                    FROM
                        picker_activity_blessing_pool bp
                    WHERE
                        DATE_FORMAT(br.create_time, '%Y-%m-%d') = DATE_FORMAT(bp.release_time, '%Y-%m-%d')) AS tianNum
            FROM
                picker_activity_blessing_record br where ${whereSql}
            GROUP BY DATE_FORMAT(br.create_time, '%Y-%m-%d');
                `

    const blessingRecordModel = this.model('activity_blessing_record');
    const list = await blessingRecordModel.query(sql);
    let datas = [
      {
        name: '福字数据',
        data: [
          [
            '日期',
            '福',
            '礻',
            '一',
            '口',
            '田',
            '礻',
            '一',
            '口',
            '田',
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (let item of list) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日')
        datas[0].data.push([
          item.create_time,
          item.fuCount,
          item.shiCount,
          item.yiCount,
          item.kouCount,
          item.tianCount,
          item.shiNum,
          item.yiNum,
          item.kouNum,
          item.tianNum
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=fuzi.xlsx");
    this.ctx.body = buffer;
  }

  /**
   * 发券数据
   */
  async couponAction () {
    const data = this.post()
    let page = this.get('page')
    const couponUserModel = this.model('activity_coupon_user');
    let whereSql = ' 1=1 '
    if (!think.isEmpty(data.create_time)) {
      whereSql += ` and DATE_FORMAT(cu.create_time, '%Y-%m-%d') = '${data.create_time}' `
    }
    if (!think.isEmpty(data.type_code)) {
      whereSql += ` and cu.type_code = '${data.type_code}' `
    }

    const res = await couponUserModel.alias('cu').field(`DATE_FORMAT(cu.create_time, '%Y-%m-%d') as create_time,c.coupon_name,COUNT(cu.id) AS allNum,COUNT(cu.receive_status = 2 OR NULL) AS receiveNum`)
      .join({
        table: 'activity_coupon',
        join: 'left',
        as: 'c',
        on: ['coupon_id', 'id']
      }).page(page, 20).where(whereSql).group(`DATE_FORMAT(cu.create_time, '%Y-%m-%d') , cu.type_code`).countSelect();

    if (!think.isEmpty(res.data)) {
      for (let item of res.data) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日')
      }
    }

    const couponModel = this.model('activity_coupon');
    const coupons = await couponModel.group('type_code').select();
    const html = this.pagination(res);
    this.assign('pagerData', html); //分页展示使用
    this.assign('list', res.data);
    this.assign('coupons', coupons);
    this.assign('data', data);
    return this.display()
  }

  /**
   * 导出发券数据
   */
  async exportCouponAction () {
    const data = this.post()
    const couponUserModel = this.model('activity_coupon_user');
    let whereSql = ' 1=1 '
    if (!think.isEmpty(data.create_time)) {
      whereSql += ` and DATE_FORMAT(cu.create_time, '%Y-%m-%d') = '${data.create_time}' `
    }
    if (!think.isEmpty(data.type_code)) {
      whereSql += ` and cu.type_code = '${data.type_code}' `
    }

    const list = await couponUserModel.alias('cu').field(`DATE_FORMAT(cu.create_time, '%Y-%m-%d') as create_time,c.coupon_name,COUNT(cu.id) AS allNum,COUNT(cu.receive_status = 2 OR NULL) AS receiveNum`)
      .join({
        table: 'activity_coupon',
        join: 'left',
        as: 'c',
        on: ['coupon_id', 'id']
      }).where(whereSql).group(`DATE_FORMAT(cu.create_time, '%Y-%m-%d') , cu.type_code`).select();

    let datas = [
      {
        name: '发券数据',
        data: [
          [
            '时间',
            '优惠券类别',
            '发放量',
            '领取量'
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (let item of list) {
        item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日')
        datas[0].data.push([
          item.create_time,
          item.coupon_name,
          item.allNum,
          item.receiveNum
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=coupon.xlsx");
    this.ctx.body = buffer;
  }

  /**
   * 用户信息
   */
  async userAction () {
    let data = this.post()
    let page = this.get('page')
    const accountModel = this.model('chinauff_account');

    let where = {}
    let totalWhere = {}
    if (!think.isEmpty(data.name)) {
      where[`a.name`] = data.name;
      totalWhere[`name`] = data.name;
    }
    if (!think.isEmpty(data.mobile)) {
      where[`a.mobile`] = data.mobile;
      totalWhere[`mobile`] = data.mobile;
    }
    if (!think.isEmpty(data.startTime) && !think.isEmpty(data.endTime)) {
      let startTime = new Date(`${data.startTime} 00:00:00`).getTime();
      let endTime = new Date(`${data.endTime} 23:59:59`).getTime();

      where[`a.createTime`] = {'>=': startTime, '<=': endTime}
      totalWhere[`createTime`] = {'>=': startTime, '<=': endTime}
    }
    const total = await accountModel.where(totalWhere).count('id');
    const res = await accountModel.alias('a').field(`
            a.name,a.mobile,
            (SELECT 
                COUNT(bu.id)
            FROM
            picker_activity_blessing_user bu
            WHERE
                a.openId = bu.openid) AS fuCount,
            (SELECT 
                COUNT(br.blessing_type = 1 OR NULL)
            FROM
                picker_activity_blessing_record br
            WHERE
                a.openId = br.openid) AS shiCount,
            (SELECT 
                    COUNT(br.blessing_type = 2 OR NULL)
                FROM
                    picker_activity_blessing_record br
                WHERE
                    a.openId = br.openid) AS yiCount,
            (SELECT 
                    COUNT(br.blessing_type = 3 OR NULL)
                FROM
                    picker_activity_blessing_record br
                WHERE
                    a.openId = br.openid) AS kouCount,
            (SELECT 
                    COUNT(br.blessing_type = 4 OR NULL)
                FROM
                    picker_activity_blessing_record br
                WHERE
                    a.openId = br.openid) AS tianCount,
            (SELECT 
                    COUNT(cu.id)
                FROM
                    picker_activity_coupon_user cu
                WHERE
                    a.openId = cu.openid
                        AND cu.receive_status = 2) AS couponCount,
            (SELECT 
                    COUNT(acu.id)
                FROM
                    picker_activity_card_user acu
                WHERE
                    a.openId = acu.openid
                        AND acu.receive_time IS NOT NULL) AS cardCount,
            (SELECT 
                    COUNT(h.id)
                FROM
                    picker_activity_help h
                WHERE
                    a.openId = h.be_openid) AS inviteHelpCount,
            (SELECT 
                    COUNT(ah.id)
                FROM
                    picker_activity_help ah
                WHERE
                    a.openId = ah.openid) AS joinHelpCount 
                `).page(page, 20).where(where).countSelect(total);
    const html = this.pagination(res);
    this.assign('pagerData', html); //分页展示使用
    this.assign('list', res.data);
    this.assign('data', data);
    return this.display()
  }

  /**
   * 导出用户信息
   */
  async exportUserInfoAction () {
    let data = this.post()
    const accountModel = this.model('chinauff_account');

    let where = {}
    if (!think.isEmpty(data.name)) {
      where[`a.name`] = data.name;
    }
    if (!think.isEmpty(data.mobile)) {
      where[`a.mobile`] = data.mobile;
    }
    if (!think.isEmpty(data.startTime) && !think.isEmpty(data.endTime)) {
      let startTime = new Date(`${data.startTime} 00:00:00`).getTime();
      let endTime = new Date(`${data.endTime} 23:59:59`).getTime();
      where[`a.createTime`] = {'>=': startTime, '<=': endTime}
    }

    const list = await accountModel.alias('a').field(`
            a.name,a.mobile,
            (SELECT 
                COUNT(bu.id)
            FROM
            picker_activity_blessing_user bu
            WHERE
                a.openId = bu.openid) AS fuCount,
            (SELECT 
                COUNT(br.blessing_type = 1 OR NULL)
            FROM
                picker_activity_blessing_record br
            WHERE
                a.openId = br.openid) AS shiCount,
            (SELECT 
                    COUNT(br.blessing_type = 2 OR NULL)
                FROM
                    picker_activity_blessing_record br
                WHERE
                    a.openId = br.openid) AS yiCount,
            (SELECT 
                    COUNT(br.blessing_type = 3 OR NULL)
                FROM
                    picker_activity_blessing_record br
                WHERE
                    a.openId = br.openid) AS kouCount,
            (SELECT 
                    COUNT(br.blessing_type = 4 OR NULL)
                FROM
                    picker_activity_blessing_record br
                WHERE
                    a.openId = br.openid) AS tianCount,
            (SELECT 
                    COUNT(cu.id)
                FROM
                    picker_activity_coupon_user cu
                WHERE
                    a.openId = cu.openid
                        AND cu.receive_status = 2) AS couponCount,
            (SELECT 
                    COUNT(acu.id)
                FROM
                    picker_activity_card_user acu
                WHERE
                    a.openId = acu.openid
                        AND acu.receive_time IS NOT NULL) AS cardCount,
            (SELECT 
                    COUNT(h.id)
                FROM
                    picker_activity_help h
                WHERE
                    a.openId = h.be_openid) AS inviteHelpCount,
            (SELECT 
                    COUNT(ah.id)
                FROM
                    picker_activity_help ah
                WHERE
                    a.openId = ah.openid) AS joinHelpCount 
                `).where(where).select();
    let datas = [
      {
        name: '用户信息',
        data: [
          [
            '用户名',
            '手机号',
            '福',
            '礻',
            '一',
            '口',
            '田',
            '领劵数据',
            '领卡数据',
            '邀请助力数',
            '参与助力数'
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (const item of list) {
        datas[0].data.push([
          item.name,
          item.mobile,
          item.fuCount,
          item.shiCount,
          item.yiCount,
          item.kouCount,
          item.tianCount,
          item.couponCount,
          item.cardCount,
          item.inviteHelpCount,
          item.joinHelpCount
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=user.xlsx");
    this.ctx.body = buffer;
  }

  /**
   * 纳新用户
   */
  async newsAction () {
    let data = this.post()
    let page = this.get('page')
    const accountModel = this.model('chinauff_account');
    let whereSql = ' a.isNew = 1 ';//纳新用户
    if (!think.isEmpty(data.create_time)) {
      whereSql += ` and FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') = '${data.create_time}' `
    }

    let sql = `select count(1) as count from (
                SELECT  COUNT(a.id) FROM 
                picker_chinauff_account a 
                where ${whereSql} GROUP BY FROM_UNIXTIME(a.createTime / 1000, '%Y-%m-%d')) t `;
    let total = await accountModel.query(sql)

    let res = await accountModel.alias('a').field(`
        FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') as create_time ,count('id') as allNum
        `).page(page, 20).where(whereSql).group(`FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') `).countSelect(total[0].count);

    if (think.isEmpty(res.data)) {
      res.count = 0;
      res.totalPages = 0;
    }
    const html = this.pagination(res);
    this.assign('pagerData', html); //分页展示使用
    this.assign('list', res.data);
    this.assign('data', data);
    return this.display()
  }

  /**
   * 导出纳新用户
   */
  async exportNewsAction () {
    let data = this.post()
    const accountModel = this.model('chinauff_account');
    let whereSql = ' a.isNew = 1 ';//纳新用户
    if (!think.isEmpty(data.create_time)) {
      whereSql += ` and FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') = '${data.create_time}' `
    }

    let list = await accountModel.alias('a').field(`
        FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') as create_time ,count('id') as allNum
        `).where(whereSql).group(`FROM_UNIXTIME(a.createTime/1000, '%Y-%m-%d') `).select();

    let datas = [
      {
        name: '纳新用户',
        data: [
          [
            '时间',
            '纳新数'
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (const item of list) {
        datas[0].data.push([
          item.create_time,
          item.allNum
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=news.xlsx");
    this.ctx.body = buffer;
  }

  /**
   * 门店配货
   */
  async allocationAction () {
    let nowDate = null;
    let data = this.post();
    let where = ``
    if (think.isEmpty(data.reserve_date)) {
      //默认为距今第三天
      // nowDate = new Date()
      // nowDate.setDate(nowDate.getDate() + 3);
      // nowDate = moment(nowDate).format('YYYY-MM-DD')
      where = `DateDiff(r.reserve_date, now())<=3 AND DATEDIFF(r.reserve_date,NOW())>=0`
    } else {
      nowDate = data.reserve_date;
      where = `r.reserve_date = '${nowDate}' `
    }
    if (!think.isEmpty(data.shop_code)) {
      where += ` and r.shop_id= ${data.shop_code}`;
    }
    let sql = `
            SELECT 
                r.reserve_date,
                s.shop_name,
                shop_code,
                s.num,
                COUNT(r.id) AS reserve_count,
                (SELECT 
                        COUNT(e.id)
                    FROM
                        picker_activity_exchange e
                    WHERE
                        r.shop_id = e.shop_id
                            AND DATE_FORMAT(e.create_time, '%Y-%m-%d') = r.reserve_date) AS exchange_count
            FROM
                picker_activity_reserve r
                    LEFT JOIN
                picker_chinauff_shop s ON r.shop_id = s.shop_code
            WHERE ${where}
            GROUP BY r.shop_id;
        `
    const reserveModel = this.model('activity_reserve');
    let list = await reserveModel.query(sql);

    const shopModel = this.model('chinauff_shop');
    const shops = await shopModel.select();
    this.assign('list', list);
    this.assign('shops', shops);
    this.assign('data', data);
    return this.display();
  }

  /**
   * 导出门店配货
   */
  async exportAllocationAction () {
    let nowDate = null;
    let data = this.post();
    if (think.isEmpty(data.reserve_date)) {
      //默认为距今第三天
      nowDate = new Date()
      nowDate.setDate(nowDate.getDate() + 3);
      nowDate = moment(nowDate).format('YYYY-MM-DD')
    } else {
      nowDate = data.reserve_date;
    }
    let where = `r.reserve_date = '${nowDate}' `
    if (!think.isEmpty(data.shop_code)) {
      where += ` and r.shop_id= ${data.shop_code}`;
    }
    let sql = `
            SELECT 
                r.reserve_date,
                s.shop_name,
                shop_code,
                s.num,
                COUNT(r.id) AS reserve_count,
                (SELECT 
                        COUNT(e.id)
                    FROM
                        picker_activity_exchange e
                    WHERE
                        r.shop_id = e.shop_id
                            AND DATE_FORMAT(e.create_time, '%Y-%m-%d') = r.reserve_date) AS exchange_count
            FROM
                picker_activity_reserve r
                    LEFT JOIN
                picker_chinauff_shop s ON r.shop_id = s.shop_code
            WHERE ${where}
            GROUP BY r.shop_id;
        `
    const reserveModel = this.model('activity_reserve');
    let list = await reserveModel.query(sql);
    let datas = [
      {
        name: '门店配货',
        data: [
          [
            '日期',
            '门店名称',
            '预约数',
            '兑换数',
            '库存'
          ]
        ]
      }
    ]
    if (!think.isEmpty(list)) {
      for (const item of list) {
        datas[0].data.push([
          item.reserve_date,
          item.shop_name,
          item.reserve_count,
          item.exchange_count,
          item.num
        ])
      }
    }
    // 写xlsx
    let buffer = xlsx.build(datas);
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats');
    this.ctx.set("Content-Disposition", "attachment; filename=allocation.xlsx");
    this.ctx.body = buffer;
  }

  /**
   * 更新库存
   */
  async updateshopAction () {
    const shopModel = this.model('chinauff_shop');
    if (this.isPost) {
      const data = this.post();
      let updateData = null;
      if (!think.isEmpty(data.add_num)) {
        updateData = ['exp', `num+${parseInt(data.add_num)}`]
      } else if (!think.isEmpty(data.subtract_num)) {
        updateData = ['exp', `num-${parseInt(data.subtract_num)}`]
      }
      await shopModel.where({
        shop_code: data.shop_code
      }).update({
        num: updateData
      });
      return this.redirect('/admin/blessing/allocation')
    } else {
      const shops = await shopModel.select();
      this.assign('shops', shops);
      return this.display();
    }
  }

}