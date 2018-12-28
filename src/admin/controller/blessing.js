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
        const res = await reserveModel.alias('r').field(`r.reserve_date,r.create_time,r.status as 'reserve_status',s.shop_name,s.shop_code,a.name,a.userInfo->>'$.mobile' as mobile,b.status,b.exchange_time`)
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
        }).page(page,20).countSelect();

        if (!think.isEmpty(res.data)) {
            for (let item of res.data) {
                console.log(item.create_time)
                item.create_time = moment(new Date(item.create_time)).format('YYYY年MM月DD日 HH:mm:ss')
                item.reserve_date = moment(new Date(item.reserve_date)).format('YYYY年MM月DD日')
                switch (item.reserve_status) {
                    case 1:
                        item.reserve_status = '正常';
                        break;
                    case 2:
                        item.reserve_status = '已取消';
                        break;
                }
                switch (item.status) {
                    case 2:
                        item.status = '未兑换';
                        break;
                    case 3:
                        item.status = '已兑换';
                        break;
                }
            }
        }
        const html = this.pagination(res);
        this.assign('pagerData', html); //分页展示使用
        this.assign('list', res.data);
        return this.display()
    }
}