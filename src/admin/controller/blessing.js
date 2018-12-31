const moment = require('moment');
/**
 * 后台 集福接口
 */
module.exports = class extends think.common.Admin {
    constructor(ctx) {
        super(ctx); // 调用父级的 constructor 方法，并把 ctx 传递进去
    }

    /**
     * 预约管理
     */
    async reserveAction() {
        let page = this.get('page')
        const reserveModel = this.model('activity_reserve');
        const res = await reserveModel.alias('r').field(`r.id,r.reserve_date,r.create_time,r.status as 'reserve_status',s.shop_name,s.shop_code,a.name,a.userInfo->>'$.mobile' as mobile,b.status,b.exchange_time`)
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
            }).page(page, 20).countSelect();

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
        const html = this.pagination(res);
        this.assign('pagerData', html); //分页展示使用
        this.assign('list', res.data);
        return this.display()
    }

    /**
     * 取消预约
     */
    async cancelReserveAction() {
        const data = this.get();
        if (think.isEmpty(data.id)) {
            return this.fail('请求参数错误')
        }

        const reserveModel = this.model('activity_reserve');
        await reserveModel.where({
            id: data.id
        }).update({
            status: 2
        });
        return this.redirect('/admin/blessing/reserve')
    }

    /**
     * 兑换记录
     */
    async exchangeAction() {
        let page = this.get('page')
        const exchangeModel = this.model('activity_exchange');
        const res = await exchangeModel.alias('c').field(`c.id,c.create_time,s.shop_name,s.shop_code,a.name,a.userInfo->>'$.mobile' as mobile`)
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
            }).page(page, 20).countSelect();

        if (!think.isEmpty(res.data)) {
            for (let item of res.data) {
                item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日 HH:mm:ss')
            }
        }
        const html = this.pagination(res);
        this.assign('pagerData', html); //分页展示使用
        this.assign('list', res.data);
        return this.display()
    }

    /**
     * 福字数据
     */
    async fuziAction() {
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
                picker_activity_blessing_record br
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
        return this.display()
    }

    /**
     * 发券数据
     */
    async couponAction(){
        let page = this.get('page')
        const couponUserModel = this.model('activity_coupon_user');
        const res = await couponUserModel.alias('cu').field(`DATE_FORMAT(cu.create_time, '%Y-%m-%d') as create_time,c.coupon_name,COUNT(cu.id) AS allNum,COUNT(cu.receive_status = 2 OR NULL) AS receiveNum`)
        .join({
            table: 'activity_coupon',
            join: 'left',
            as: 'c',
            on: ['coupon_id', 'id']
        }).page(page, 20).group(`DATE_FORMAT(cu.create_time, '%Y-%m-%d') , cu.coupon_id`).countSelect();

        if (!think.isEmpty(res.data)) {
            for (let item of res.data) {
                item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日')
            }
        }

        // let sql =  `
        //     SELECT 
        //         DATE_FORMAT(cu.create_time, '%Y-%m-%d') as create_time,
        //         c.coupon_name,
        //         COUNT(cu.id) AS allNum,
        //         COUNT(cu.receive_status = 2 OR NULL) AS receiveNum
        //     FROM
        //         picker_activity_coupon_user cu
        //             LEFT JOIN
        //         picker_activity_coupon c ON cu.coupon_id = c.id
        //     GROUP BY DATE_FORMAT(cu.create_time, '%Y-%m-%d') , cu.coupon_id;
        // `
        // const list = await couponUserModel.query(sql);
        // if (!think.isEmpty(list)) {
        //     for (let item of list) {
        //         item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日')
        //     }
        // }

        const html = this.pagination(res);
        this.assign('pagerData', html); //分页展示使用
        this.assign('list', res.data);
        return this.display()
    }

    /**
     * 用户信息
     */
    async userAction(){
        let page = this.get('page')
        const accountModel = this.model('chinauff_account');
        const res = await accountModel.alias('a').field(`
        a.name,a.userInfo->>'$.mobile' as mobile,
        COUNT(bu.id) AS fuCount,
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
            `)
        .join({
            table: 'activity_blessing_user',
            join: 'left',
            as: 'bu',
            on: ['openId', 'openid']
        }).page(page, 10).group(`a.openId`).countSelect();
        const html = this.pagination(res);
        console.log('====================')
        console.log(html)
        this.assign('pagerData', html); //分页展示使用
        this.assign('list', res.data);
        return this.display()
    }
}