/*
 * @Author: Yorn Qiu
 * @Date: 2022-06-07 14:18:04
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-02-01 17:51:08
 * @FilePath: /veloc/packages/static/index.js
 * @Description: serve static files
 */

const { resolve } = require('node:path')
const assert = require('node:assert')

/**
 * Serve files in root directory
 * @param {object|string} globalOptions - root directory or options
 * @param {string} globalOptions.root
 * @param {string} globalOptions.index  default to 'index.html'
 * @returns
 */
module.exports = function (globalOptions) {
  const root = typeof globalOptions === 'string' ? globalOptions : globalOptions?.root

  assert(root, 'root is required')

  const options = {
    root: resolve(root),
    index: globalOptions.index || 'index.html',
  }

  return async function static(req, res) {
    if (typeof res.send !== 'function')
      throw new Error('@veloc/send or alternative is required, have you ever installed it?')

    // serve only on GET or HEAD requests
    if (req.method !== 'HEAD' && req.method !== 'GET') return
    // response is already handled
    if (res.body != null || res.status !== 404) return

    try {
      await res.send(req.path, options)
    } catch (err) {
      if (err.status !== 404) {
        throw err
      }
    }
  }
}
