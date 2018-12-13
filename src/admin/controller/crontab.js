module.exports = class extends think.Controller {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction() {
    // auto render template file index_index.html
    return this.display();
  }
  async cloaAction() {
    // 禁止 URL 访问该 Action
    if (!this.isCli) {
      const error = this.controller('common/error');
      return error.noAction('Only invoked in cli mode！');
    }

    // 定时统计
    // analytics
    const analyticsModel = this.model('analytics')
    const dayView = await analyticsModel.getDayPageView()
    const allView = await analyticsModel.getAllPageView()

    // 查询未付款，未作废的订单的订单
    // const map = {
    //   pay_status: 0,
    //   status: 2,
    //   create_time: ['<', (new Date().getTime() - (Number(this.config('setup.ORDER_DELAY')) * 60000))],
    //   type: 0
    // };
    // const order = await this.model('order').where(map).field('id').select();
    // if (!think.isEmpty(order)) {
    //   for (const v of order) {
    //     await this.model('order').where({id: v.id}).update({status: 6, admin_remark: '规定时间未付款系统自动作废'});
        // 释放库存
        // await this.model('cmswing/order').stock(v.id, false);
      // }
    // }

    // think.logger.debug(new Date(), '订单作废任务执行时间');
    // this.end();
    return this.body = '';
  }
};
