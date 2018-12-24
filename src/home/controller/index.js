/* eslint-disable no-undef,max-depth,new-cap */
const Base = require('./base.js');

module.exports = class extends Base {
  async indexAction () {
    return this.redirect('/admin/user/login')
  }
}
