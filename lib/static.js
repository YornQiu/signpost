/*
 * @Author: Yorn Qiu
 * @Date: 2022-06-07 14:18:04
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-17 16:21:04
 * @FilePath: /vivid/lib/static.js
 * @Description: serve static files
 */

const { resolve } = require('node:path')
const assert = require('node:assert')

/**
 * Serve files in root directory
 * @param {object} globalOptions
 * @param {string} globalOptions.root
 * @param {string} globalOptions.index
 * @returns
 */
module.exports = function (globalOptions) {
  const { root } = globalOptions

  assert(root, 'root is required')

  const options = {
    root: resolve(root),
    index: globalOptions.index || 'index.html',
  }

  return async function static(req, res) {
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
