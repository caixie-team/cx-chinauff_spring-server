const socketio = require('think-websocket-socket.io');
exports.websocket = {
  type: 'socketio',
  common: {
    // common config
  },
  socketio: {
    handle: socketio,
    // allowOrigin: '127.0.0.1:8360',  // 默认所有的域名都允许访问
    path: '/socket.io',             // 默认 '/socket.io'
    adapter: null,                  // 默认无 adapter
    messages: {
      open: '/websocket/open',
      close: '/websocket/close',
      addUser: '/websocket/addUser'
    }
  }
}
