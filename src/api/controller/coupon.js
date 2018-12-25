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
        //第一阶段
        this.one_start_date = '2019-01-05';
        this.one_end_date = '2019-01-09';

        //第二阶段
        this.two_start_date = '2019-01-10';
        this.two_end_date = '2019-01-15';

        //第三阶段
        this.three_start_date = '2019-01-16';
        this.three_end_date = '2019-01-21';

        //第四阶段
        this.four_start_date = '2019-01-22';
        this.four_end_date = '2019-01-26';

        //第五阶段
        this.five_start_date = '2019-01-27';
        this.five_end_date = '2019-02-01';

        //第六阶段
        this.six_start_date = '2019-01-02';
        this.six_end_date = '2019-02-04';
    }

    /**
     * 抽奖
     */
    async hitAction() {
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

        /***************************************************/
        //step1 判断该活动账户是否有未领取的优惠券，如果有，则把未领取的优惠券返给他
        const couponUserModel = this.model('activity_coupon_user')
        let cuSql = `
            SELECT 
                 cu.coupon_code,cu.openid,c.coupon_name,c.type_code
            FROM
                picker_activity_coupon_user cu
                    LEFT JOIN
                picker_activity_coupon c ON cu.coupon_id = c.id
            WHERE
                openid = '${data.openId}'
                    AND receive_status = 1
            LIMIT 1;`;
        const cuData = await couponUserModel.query(cuSql);
        if (!think.isEmpty(cuData)) { //有未领取的优惠券
            console.log('*******返回未领取的优惠券******')
            return this.success({
                type: 1,     //1 优惠券 2 充值卡
                coupon: cuData[0]
            });
        }

        const cardModel = this.model('activity_card');
        const cardUserModel = this.model('activity_card_user');
        /***************************************************/
        //step2 判断当前时间是否在 2019.01.10-2019.01.20周期内

        let now = new Date();
        now.setDate(now.getDate() + 19)

        const nowTime = now.getTime()
        //const nowTime = new Date().getTime(); //当前时间
        const startTime = new Date('2019-01-10 00:00:00').getTime();  //充值卡发放开始时间
        const endTime = new Date('2019-01-20 23:59:59').getTime();    //充值卡发放结束时间
        if (nowTime >= startTime && nowTime <= endTime) {
            console.log('********在发卡的时间区域内*******')
            //获取中奖的次数
            const cuNum = await couponUserModel.count('id');    //发出优惠券数
            const cardNum = await cardUserModel.count('id');    //发出充值卡数

            if ((cuNum + cardNum + 1) % 51 == 0) {//可发充值卡
                let randCardSql = 'SELECT * FROM picker_activity_card ORDER BY RAND() LIMIT 1;';
                const cards = await cardModel.query(randCardSql);
                const card_code = Generate.id();
                await cardUserModel.add({
                    openid: data.openId,
                    card_id: cards[0].id,//充值卡Id
                    address: null,  //收获地址
                    recipient_name: null,//收件人姓名
                    phone_number: null,//手机号码
                    receive_time: null,//领取时间
                    card_code: card_code,//充值卡码(用于更新用户所获取的充值卡信息)
                    create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                });
                return this.success({
                    type: 2,     //1 优惠券 2 充值卡
                    card: {
                        openid: data.openId,
                        card_type: cards[0].card_type,
                        card_name: cards[0].card_name,
                        card_code: card_code
                    }
                });
            }
        }

        /***************************************************/
        //step3 走正常的优惠券领取流程

        let t = new Date()
        t.setDate(t.getDate() + 25)         // todo 上线后需要去掉
        console.log(`----${t}`)

        let coupon = {};  //优惠券奖品
        const coupon_code = Generate.id();//优惠券码
        const nowDate = moment(t).format('YYYY-MM-DD');
        console.log(nowDate)

        if (nowDate >= this.one_start_date && nowDate <= this.one_end_date) {//第一周期

            let oneSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 1 AND last_quantity > 0 ';
            oneSql += ` AND start_date = '${this.one_start_date}' AND end_date = '${this.one_end_date}' ORDER BY RAND() LIMIT 1;`;
            const couponList = await this.db.query(oneSql); //获取优惠券奖品

            if (think.isEmpty(couponList)) { //主库存已经没有优惠券奖品
                console.log('*******第一周期 备用库存******')

                //查询备用库存是否还有优惠券奖品
                let backupSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 2 AND last_quantity > 0 ';
                backupSql += ` AND start_date = '${this.one_start_date}' AND end_date = '${this.one_end_date}' ORDER BY RAND() LIMIT 1;`;
                const list = await this.db.query(backupSql); //获取备用库存优惠券奖品
                if (think.isEmpty(list)) { //备用库存已经没有优惠券
                    return this.fail(1001, '奖品已被领完');
                } else {
                    coupon = list[0];
                }
            } else {//主库存有优惠券奖品
                console.log('*******第一周期 主库存******')
                coupon = couponList[0];//优惠券奖品信息
            }
        }else if(nowDate >= this.two_start_date && nowDate <= this.two_end_date){//第二周期
            let twoSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 1 AND last_quantity > 0 ';
            twoSql += ` AND start_date >= '${this.one_start_date}' AND end_date <= '${this.two_end_date}' ORDER BY RAND() LIMIT 1;`;
            const couponList = await this.db.query(twoSql); //获取优惠券奖品
            if (think.isEmpty(couponList)) { //主库存已经没有优惠券奖品
                console.log('*******第二周期 备用库存******')
                
                //查询备用库存是否还有优惠券奖品
                let backupSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 2 AND last_quantity > 0 ';
                backupSql += ` AND start_date = '${this.two_start_date}' AND end_date = '${this.two_end_date}' ORDER BY RAND() LIMIT 1;`;
                const list = await this.db.query(backupSql); //获取备用库存优惠券奖品
                if (think.isEmpty(list)) { //备用库存已经没有优惠券
                    return this.fail(1001, '奖品已被领完');
                } else {
                    coupon = list[0];
                }
            }else{
                console.log('*******第二周期 主库存******')
                coupon = couponList[0];//优惠券奖品信息
            }
        }else if(nowDate >= this.three_start_date && nowDate <= this.three_end_date){//第三周期
            let threeSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 1 AND last_quantity > 0 ';
            threeSql += ` AND start_date >= '${this.one_start_date}' AND end_date <= '${this.three_end_date}' ORDER BY RAND() LIMIT 1;`;
            const couponList = await this.db.query(threeSql); //获取优惠券奖品
            if (think.isEmpty(couponList)) { //主库存已经没有优惠券奖品
                console.log('*******第三周期 备用库存******')
                
                //查询备用库存是否还有优惠券奖品
                let backupSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 2 AND last_quantity > 0 ';
                backupSql += ` AND start_date = '${this.three_start_date}' AND end_date = '${this.three_end_date}' ORDER BY RAND() LIMIT 1;`;
                const list = await this.db.query(backupSql); //获取备用库存优惠券奖品
                if (think.isEmpty(list)) { //备用库存已经没有优惠券
                    return this.fail(1001, '奖品已被领完');
                } else {
                    coupon = list[0];
                }
            }else{
                console.log('*******第三周期 主库存******')
                coupon = couponList[0];//优惠券奖品信息
            }
        }else if(nowDate >= this.four_start_date && nowDate <= this.four_end_date){//第四周期
            let threeSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 1 AND last_quantity > 0 ';
            threeSql += ` AND start_date >= '${this.one_start_date}' AND end_date <= '${this.four_end_date}' ORDER BY RAND() LIMIT 1;`;
            const couponList = await this.db.query(threeSql); //获取优惠券奖品
            if (think.isEmpty(couponList)) { //主库存已经没有优惠券奖品
                console.log('*******第四周期 备用库存******')
                
                //查询备用库存是否还有优惠券奖品
                let backupSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 2 AND last_quantity > 0 ';
                backupSql += ` AND start_date = '${this.four_start_date}' AND end_date = '${this.four_end_date}' ORDER BY RAND() LIMIT 1;`;
                const list = await this.db.query(backupSql); //获取备用库存优惠券奖品
                if (think.isEmpty(list)) { //备用库存已经没有优惠券
                    return this.fail(1001, '奖品已被领完');
                } else {
                    coupon = list[0];
                }
            }else{
                console.log('*******第四周期 主库存******')
                coupon = couponList[0];//优惠券奖品信息
            }
        }



        //将获得的优惠券关联到活动账户下，状态为 未领取
        await couponUserModel.add({
            openid: data.openId,
            coupon_id: coupon.id,
            receive_time: null,//领取时间
            status: 1,//使用状态(1未使用 2已使用)
            receive_status: 1,//领取状态(1未领取 2已领取)
            coupon_code: coupon_code,  //券码(仅用于更新用户所拥有的优惠券)
            create_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        });
        //优惠券库存-1
        await this.db.where({
            id: coupon.id,
            last_quantity: { '>': 0 }
        }).update({
            last_quantity: ['exp', 'last_quantity-1']
        });
        return this.success({
            type: 1,     //1 优惠券 2 充值卡
            coupon: {
                coupon_code: coupon_code,
                openid: data.openId,
                coupon_name: coupon.coupon_name,
                type_code: coupon.type_code
            }
        });
    }

    /*******************优惠券数据测试接口****************** */

    /**
	 * 初始化当天的数据 用于测试
	 */
    async initTodayAction() {
        const couponPoolModel = this.model('activity_coupon_pool');
        //主库存
        for (let i = 0; i < 10; i++) {
            let release_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            await couponPoolModel.add({
                coupon_id: 1,
                release_time: release_time,
                last_quantity: 1,
                stock_mark: 1  //库存标识 1主库存 2备用库存
            })
        }
        //备用库存
        for (let i = 0; i < 10; i++) {
            let release_time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            await couponPoolModel.add({
                coupon_id: 1,
                release_time: release_time,
                last_quantity: 1,
                stock_mark: 2  //库存标识 1主库存 2备用库存
            })
        }

        return this.success()
    }

}