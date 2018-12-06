var _extends=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var o=arguments[e];for(var i in o)Object.prototype.hasOwnProperty.call(o,i)&&(t[i]=o[i])}return t},_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};!function(t,e){"object"===("undefined"==typeof exports?"undefined":_typeof(exports))&&"undefined"!=typeof module?module.exports=e(require("./PNotify")):"function"==typeof define&&define.amd?define("PNotifyHistory",["./PNotify"],e):t.PNotifyHistory=e(PNotify)}(this,function(c){"use strict";c=c&&c.__esModule?c.default:c;var e,t={initModule:function(t){if(this.set(t),this.get().history){var e=this.get()._notice;e.get().destroy&&e.set({destroy:!1})}},beforeOpen:function(){var t=this.get(),e=t.maxInStack,o=t._options;if(e!==1/0){var i=o.stack;if(!1!==i&&c.notices&&c.notices.length>e){for(var n="top"===i.push,s=[],r=0,f=n?0:c.notices.length-1;n?f<c.notices.length:0<=f;n?f++:f--)-1!==["opening","open"].indexOf(c.notices[f].get()._state)&&c.notices[f].get().stack===i&&(e<=r?s.push(c.notices[f]):r++);for(var a=0;a<s.length;a++)s[a].close(!1)}}}};function o(t){var e,o;o=t,(e=this)._handlers=Object.create(null),e._bind=o._bind,e.options=o,e.root=o.root||e,e.store=e.root.store||o.store,this._state=s(_extends({_notice:null,_options:{}},c.modules.History.defaults),t.data),this._intro=!0,this._fragment=(this._state,{c:i,m:i,p:i,d:i}),t.target&&(this._fragment.c(),this._mount(t.target,t.anchor))}function i(){}function s(t,e){for(var o in e)t[o]=e[o];return t}function n(t){for(;t&&t.length;)t.shift()()}return s(o.prototype,{destroy:function(t){this.destroy=i,this.fire("destroy"),this.set=i,this._fragment.d(!1!==t),this._fragment=null,this._state={}},get:function(){return this._state},fire:function(t,e){var o=t in this._handlers&&this._handlers[t].slice();if(!o)return;for(var i=0;i<o.length;i+=1){var n=o[i];n.__calling||(n.__calling=!0,n.call(this,e),n.__calling=!1)}},on:function(t,e){var o=this._handlers[t]||(this._handlers[t]=[]);return o.push(e),{cancel:function(){var t=o.indexOf(e);~t&&o.splice(t,1)}}},set:function(t){if(this._set(s({},t)),this.root._lock)return;this.root._lock=!0,n(this.root._beforecreate),n(this.root._oncreate),n(this.root._aftercreate),this.root._lock=!1},_set:function(t){var e=this._state,o={},i=!1;for(var n in t)this._differs(t[n],e[n])&&(o[n]=i=!0);if(!i)return;this._state=s(s({},e),t),this._recompute(o,this._state),this._bind&&this._bind(o,this._state);this._fragment&&(this.fire("state",{changed:o,current:this._state,previous:e}),this._fragment.p(o,this._state),this.fire("update",{changed:o,current:this._state,previous:e}))},_mount:function(t,e){this._fragment[this._fragment.i?"i":"m"](t,e||null)},_differs:function(t,e){return t!=t?e==e:t!==e||t&&"object"===(void 0===t?"undefined":_typeof(t))||"function"==typeof t}}),s(o.prototype,t),o.prototype._recompute=i,(e=o).key="History",e.defaults={history:!0,maxInStack:1/0},e.init=function(t){return new e({target:document.body})},e.showLast=function(t){if(void 0===t&&(t=c.defaultStack),!1!==t){var e="top"===t.push,o=e?0:c.notices.length-1,i=void 0;do{if(!(i=c.notices[o]))return;o+=e?1:-1}while(i.get().stack!==t||!i.get()._modules.History.get().history||"opening"===i.get()._state||"open"===i.get()._state);i.open()}},e.showAll=function(t){if(void 0===t&&(t=c.defaultStack),!1!==t)for(var e=0;e<c.notices.length;e++){var o=c.notices[e];!0!==t&&o.get().stack!==t||!o.get()._modules.History.get().history||o.open()}},c.modules.History=e,o});
//# sourceMappingURL=PNotifyHistory.js.map