module.exports = [

  // [/\/admin\/experiment\/(.*)/i, 'admin/article/:1', 'get,post'],
  // ['/apidoc', 'apidoc/index', 'get'],
  ['', 'home/index/index', 'get'],
  ['/index', 'home/index/index', 'get'],
  ['/index/:order', 'home/index/index', 'get'],
  ['/p/:id', 'home/detail/index', 'get'],
  ['/dlink/:id', 'home/detail/downloadgetid', 'get'],
  ['/u/avatar', 'profile/avatar', 'get'],
  ['/u/avatar/:uid', 'profile/avatar', 'get'],
  ['/search', 'home/search/index', 'get'],
  ['/topic', 'home/keyword/index', 'get'],
  ['/topic/:key', 'home/keyword/index', 'get'],
  ['/t/:key', 'home/keyword/list', 'get'],
  ['/admin/mod/:cate_id', 'modAdminBase/index', 'get'],
  ['/admin/login', 'admin/user/login', 'get, post'],
  // [/\/addons\/(\w+)?/, 'addons/:1', 'get, post']
  [/\/m\/(\w+)?/, 'module/:1', 'get, post'],
  [/\/api\/wechat\/(\w+)?/, 'api/wechat/?action=:1', 'rest'],
  [/\/api\/(\w+)(?:\/(\w+))?$/, '/api/:1/:2', 'get, post'],
  // [/\/addons\/(\w+)?/, 'addons/:1', 'get, post'],
  // [/\/api\/wechat\/(\w+)?/, 'api/wechat/?action=:1', 'rest'],
  // [/\/api\/analytics\/(\w+)?/, 'api/analytics/?action=:1', 'rest'],
  // [/\/api\/(\w+)(?:\/(\d+))?/, 'api/:1?id=:2', 'rest'],
  // [/^(?!\/admin\/|\/home\/|\/center\/|\/api\/|\/uxxx\/):id/i, '/home/route/index/:1/', 'get'],
  ['/:category', 'route/index', 'get']
];
