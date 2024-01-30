/*
 * @Author: Yorn Qiu
 * @Date: 2024-01-30 11:44:55
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 15:09:04
 * @FilePath: /signpost/packages/cookie/index.js
 * @Description: cookie
 */

const { Cookies } = require('cookies')

/**
 *
 * @param {object} gloabalOptions
 * @param {Cookies.keys} gloabalOptions.keys
 * @param {boolean} gloabalOptions.secure
 * @returns
 */
module.exports = function (gloabalOptions = {}) {
  return function (req, res) {
    const cookies = new Cookies(req, res, gloabalOptions)
    /**
     * Req cookies
     */
    Object.defineProperty(req, 'cookies', {
      configurable: true,
      enumerable: true,
      get: function () {
        if (!this.cookies) this.cookies = cookies
        return this.cookies
      },
    })

    Object.defineProperty(res, 'cookies', {
      configurable: true,
      enumerable: true,
      get: function () {
        if (!this.cookies) this.cookies = cookies
        return this.cookies
      },
    })
  }
}
