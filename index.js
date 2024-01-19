/*
 * @Author: Yorn Qiu
 * @Date: 2024-01-17 16:51:38
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-17 16:56:45
 * @FilePath: /vivid/index.js
 * @Description:
 */

'use strict'

module.exports = require('./lib/core/application')

exports.Router = require('./lib/router')
exports.static = require('./lib/static')
exports.cors = require('./lib/cors')
