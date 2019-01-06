'use strict';

const util = require('util');
const path = require('path');

const { stat } = require('fs');

const statAsync = util.promisify(stat);

const formstream = require('formstream');

/**
 * 获取临时素材
 * 详情请见：<http://mp.weixin.qq.com/wiki/11/07b6b76a6b6e8848e855a435d5e34a5f.html>
 * Examples:
 * ```
 * api.getMedia('media_id');
 * ```
 * - `result`, 调用正常时得到的文件Buffer对象
 * - `res`, HTTP响应对象
 * @param {String} mediaId 媒体文件的ID
 */
exports.getMedia = async function (request, accessToken, mediaId) {
  // const { accessToken } = await this.ensureAccessToken();
  const prefix = 'https://api.weixin.qq.com/cgi-bin/';
  const url = prefix + 'media/get?access_token=' + accessToken + '&media_id=' + mediaId;
  const opts = {
    timeout: 60000 // 60秒超时
  };
  return request(url, opts);
};

