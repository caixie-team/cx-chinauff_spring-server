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
    }


    /**
     * 抽奖
     */
    async hitAction() {

        await this.validateActivityDate(); //验证活动时间

        const data = this.post()
        if (think.isEmpty(data.openId)) {
            return this.fail('请求参数错误')
        }

        //判断openid是否存在
        const chinauffAccountModel = this.model('chinauff_account')
        const chinauffAccount = await chinauffAccountModel.where({ openId: data.openId }).find();
        if (think.isEmpty(chinauffAccount)) {
            return this.fail(1004, '活动账户不存在')
        }

        /***************************************************/
        //step1 判断该活动账户是否有未领取的优惠券，如果有，则把未领取的优惠券返给他

        //未领取的充值卡
        await this.unreceived(data.openId);

        /***************************************************/
        //step2 判断当前时间是否在 2019.01.10-2019.01.20周期内

        //发会员充值卡
        await this.sendCard(data.openId);

        /***************************************************/
        //step3 走正常的优惠券领取流程

        let now = new Date()
        // now.setDate(now.getDate() + 11)         // 用于测试 todo 上线后需要去掉
        const currentDate = moment(now).format('YYYY-MM-DD');
        console.log(`******** 当前日期: ${currentDate} *******`)

        const dataRes = await this.getCycle(currentDate);
        if (think.isEmpty(dataRes)) {
            return this.fail(1005, '不在活动期间')
        }

        await this.getCoupon(data.openId, dataRes.startDate, dataRes.endDate);
    }

    /**
     * 验证活动日期
     */
    async validateActivityDate() {
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
    async unreceived(openId) {
        const couponUserModel = this.model('activity_coupon_user')
        let cuSql = `
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
        const res = await couponUserModel.query(cuSql);
        if (!think.isEmpty(res)) { //有未领取的优惠券
            console.log('*******返回未领取的优惠券******')
            return this.success({
                type: 1,     //1 优惠券 2 充值卡
                coupon: res[0]
            });
        }
    }

    /**
     * 发充值卡
     * @param {微信openId} openId 
     */
    async sendCard(openId) {
        const couponUserModel = this.model('activity_coupon_user')
        const cardModel = this.model('activity_card');
        const cardUserModel = this.model('activity_card_user');

        // let now = new Date();
        // now.setDate(now.getDate() + 19)
        // const nowTime = now.getTime()

        const nowTime = new Date().getTime(); //当前时间

        const startTime = new Date('2019-01-10 00:00:00').getTime();  //充值卡发放开始时间
        const endTime = new Date('2019-01-20 23:59:59').getTime();    //充值卡发放结束时间
        if (nowTime >= startTime && nowTime <= endTime) {
            console.log('******** 会员充值卡产生时间 *******')

            //先判断该用户是否已经领过会员充值卡
            const cardUserData = await cardUserModel.where({
                openid: openId
            }).find();

            if (!think.isEmpty(cardUserData)) {
                if (think.isEmpty(cardUserData.receive_time)) {
                    console.log('********将中奖未领取的会员充值卡返给用户*******')

                    const cardData = await cardModel.where({
                        id: cardUserData.card_id
                    }).find();
                    return this.success({
                        type: 2,     //1 优惠券 2 充值卡
                        card: {
                            openid: openId,
                            card_type: cardData.card_type,
                            card_name: cardData.card_name,
                            card_code: cardUserData.card_code
                        }
                    });
                }
            } else {
                //获取中奖的次数
                const cuNum = await couponUserModel.count('id');    //发出优惠券数
                const cardNum = await cardUserModel.count('id');    //发出充值卡数

                if ((cuNum + cardNum + 1) % 51 == 0) {//可发充值卡
                    // let randCardSql = 'SELECT * FROM picker_activity_card ORDER BY RAND() LIMIT 1;'; //支持多种会员充值卡

                    let randCardSql = 'SELECT * FROM picker_activity_card LIMIT 1;';
                    const cards = await cardModel.query(randCardSql);
                    const card_code = Generate.id();
                    await cardUserModel.add({
                        openid: openId,
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
                            openid: openId,
                            card_type: cards[0].card_type,
                            card_name: cards[0].card_name,
                            card_code: card_code
                        }
                    });
                }
            }
        } else {
            console.log('******** 不在会员充值卡产生时间 *******')
        }
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
                endDate: one_end_date
            }
        } else if (currentDate >= two_start_date && currentDate <= two_end_date) {//第二周期
            data = {
                startDate: two_start_date,
                endDate: two_end_date
            }
        } else if (currentDate >= three_start_date && currentDate <= three_end_date) {//第三周期
            data = {
                startDate: three_start_date,
                endDate: three_end_date
            }
        } else if (currentDate >= four_start_date && currentDate <= four_end_date) {//第四周期
            data = {
                startDate: four_start_date,
                endDate: four_end_date
            }
        } else if (currentDate >= five_start_date && currentDate <= five_end_date) {//第五周期
            data = {
                startDate: five_start_date,
                endDate: five_end_date
            }
        } else if (currentDate >= six_start_date && currentDate <= six_end_date) {//第六周期
            data = {
                startDate: six_start_date,
                endDate: six_end_date
            }
        }
        return data;
    }

    /**
     * 
     * @param {微信openId} openId 
     */
    async getCoupon(openId, startDate, endDate) {
        let coupon = {};
        let sql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 1 AND last_quantity > 0 ';
        sql += ` AND start_date >= '2019-01-05' AND end_date <= '${endDate}' ORDER BY RAND() LIMIT 1;`;

        const couponList = await this.db.query(sql); //获取优惠券奖品
        if (think.isEmpty(couponList)) { //主库存已经没有优惠券奖品
            console.log(`******* 备用库存 ******`)
            console.log(`******* startDate:${startDate} - endDate:${endDate} ******`)

            //查询备用库存是否还有优惠券奖品
            let backupSql = 'SELECT * FROM picker_activity_coupon WHERE stock_mark = 2 AND last_quantity > 0 ';
            backupSql += ` AND start_date = '${startDate}' AND end_date = '${endDate}' ORDER BY RAND() LIMIT 1;`;
            const list = await this.db.query(backupSql); //获取备用库存优惠券奖品
            if (think.isEmpty(list)) { //备用库存已经没有优惠券
                console.log(`******* 奖品已被领完 ******`)
                return this.fail(1001, '奖品已被领完');
            } else {
                coupon = list[0];
            }
        } else {
            console.log(`******* 主库存 ******`)
            console.log(`******* startDate:${startDate} - endDate:${endDate}******`)

            coupon = couponList[0];//优惠券奖品信息
        }
        await this.hitHandle(openId, coupon);
    }
    /**
     * 中奖处理
     * @param {微信openId} openId 
     * @param {优惠券奖品信息} coupon 
     */
    async hitHandle(openId, coupon = {}) {
        const coupon_code = Generate.id();
        const couponUserModel = this.model('activity_coupon_user')
        //将获得的优惠券关联到活动账户下，状态为 未领取
        await couponUserModel.add({
            openid: openId,
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
                openid: openId,
                coupon_name: coupon.coupon_name,
                type_code: coupon.type_code
            }
        });
    }

    /**
     * 领取会员充值卡
     */
    async receiveCardAction() {
        const data = this.post()
        if (think.isEmpty(data.card_code)) {
            return this.fail('请求参数错误')
        }
        if (think.isEmpty(data.address)) {
            return this.fail('地址必须填写')
        }
        if (think.isEmpty(data.recipient_name)) {
            return this.fail('收件人姓名必须填写')
        }
        if (think.isEmpty(data.phone_number)) {
            return this.fail('手机号码必须填写')
        }

        const cardUserModel = this.model('activity_card_user');
        const cardUserData = await cardUserModel.where({ card_code: data.card_code }).find();
        if (think.isEmpty(cardUserData)) {
            return this.fail('会员充值卡不存在')
        }

        await cardUserModel.where({
            card_code: data.card_code
        }).update({
            address: data.address,  //收货地址
            recipient_name: data.recipient_name,//收件人姓名
            phone_number: data.phone_number,//手机号码
            receive_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  //领取时间
        });
        return this.success('领取成功')
    }

    /**
     * 领取优惠券
     */
    async receiveCouponAction() {
        const data = this.post()
        if (think.isEmpty(data.coupon_code)) {
            return this.fail('请求参数错误')
        }

        const couponUserModel = this.model('activity_coupon_user')
        const couponUserData = await couponUserModel.where({
            coupon_code: data.coupon_code
        }).find();

        if (think.isEmpty(couponUserData)) {
            return this.fail('优惠券不存在')
        }

        await couponUserModel.where({
            coupon_code: data.coupon_code
        }).update({
            receive_status: 2,//领取状态(1未领取 2已领取)
            release_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')  //领取时间
        });

        return this.success('领取成功')
    }


    /*******************test****************** */

    async  getResult(arr) {
        console.log(arr)
        var leng = 150000;//获取总数

        for (var i = 0; i < arr.length; i++) {
            var random = parseInt(Math.random() * leng);       //获取 0-总数 之间的一个随随机整数
            let p = parseInt(arr[i])
            console.log(`p:  ${p}`)

            if (random < p) {
                console.log(`--------${i}-------`)
                return i                                     //如果在当前的概率范围内,得到的就是当前概率
            } else {
                leng -= p                               //否则减去当前的概率范围,进入下一轮循环
                console.log(`leng:  ${leng}`)
            }
        }
    }

    async testAction() {
        
        var gifts = [
            {
                "name": "鱼肉狮子头套餐免费吃券",
                "prop": 45000
            },
            {
                "name": "4元代金券（29起用，全天）",
                "prop": 30000
            },
            {
                "name": "8元代金券（35起用）",
                "prop": 15000
            },
            {
                "name": "蜜汁鸡翅5折券",
                "prop": 15000
            },
            {
                "name": "橙汁5折券",
                "prop": 45000
            },
        ]
        
        // var gifts = [
        //     {
        //         "name": "鱼肉狮子头套餐免费吃券",
        //         "prop": 0.3
        //     },
        //     {
        //         "name": "4元代金券（29起用，全天）",
        //         "prop": 0.2
        //     },
        //     {
        //         "name": "8元代金券（35起用）",
        //         "prop": 0.1
        //     },
        //     {
        //         "name": "蜜汁鸡翅5折券",
        //         "prop": 0.1
        //     },
        //     {
        //         "name": "橙汁5折券",
        //         "prop": 0.3
        //     },
        //     // {
        //     //     "name": "红豆养生汤5折券",
        //     //     "prop": 0.01
        //     // },
        //     // {
        //     //     "name": "红枣银耳汤5折券",
        //     //     "prop": 0.01
        //     // },
        //     // {
        //     //     "name": "冰镇黄桃5折券",
        //     //     "prop": 0.01
        //     // }
        // ];
        var gArr = [];
        for (var i = 0; i < gifts.length; i++) {
            gArr.push(gifts[i]['prop'])
        }
        const result = await this.getResult(gArr)
        console.log(result)
        const data = gifts[result]['name'];
        console.log(data)

        return this.success(data);
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