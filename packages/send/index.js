/*
 * @Author: Yorn Qiu
 * @Date: 2022-06-06 17:51:08
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-26 16:12:49
 * @FilePath: /veloc/packages/send/index.js
 * @Description: send files
 */
const { basename, normalize, resolve } = require('node:path')
const { stat, access } = require('node:fs/promises')
const { createReadStream } = require('node:fs')
const assert = require('node:assert')

/**
 * Send files
 * Usage: res.send(path, options)
 * @param {object} globalOptions
 * @param {string} globalOptions.root
 * @param {number} globalOptions.maxAge
 * @param {boolean} globalOptions.immutable
 * @param {boolean} globalOptions.brotli
 * @param {boolean} globalOptions.gzip
 * @param {function} globalOptions.setHeaders
 * @param {string} globalOptions.index
 */
module.exports = function (globalOptions) {
  return function (req, res) {
    Object.defineProperty(res, 'send', {
      configurable: true,
      enumerable: true,
      value: async function (path, options) {
        assert(path, 'path is required')

        const res = this
        const opts = Object.assign({}, globalOptions, options)

        // options
        const root = opts.root ? normalize(resolve(opts.root)) : ''
        const maxAge = opts.maxAge || 0
        const immutable = opts.immutable || false
        const brotli = opts.brotli !== false
        const gzip = opts.gzip !== false
        const setHeaders = opts.setHeaders
        const index = opts.index

        // normalize path
        let filePath = decodeURIComponent(path)
        filePath = resolve(root, filePath.replace(/^\/+/, ''))

        if (setHeaders && typeof setHeaders !== 'function') throw new TypeError('setHeaders must be function')

        const acceptsEncodings = req.get('Accept-Encoding')
        // send zipped file
        if (brotli && acceptsEncodings.includes('br') && (await exists(filePath + '.br'))) {
          filePath += '.br'
          res.set('Content-Encoding', 'br')
          res.remove('Content-Length')
        } else if (gzip && acceptsEncodings.includes('gzip') && (await exists(filePath + '.gz'))) {
          filePath = filePath + '.gz'
          res.set('Content-Encoding', 'gzip')
          res.remove('Content-Length')
        }

        try {
          let stats = await stat(filePath)
          if (stats.isDirectory()) {
            if (index) {
              filePath = resolve(filePath, index)
              stats = await stat(filePath)
            } else {
              return
            }
          }

          const filename = basename(filePath)

          if (setHeaders) setHeaders(res, path, stats)

          // set header
          res.set('Content-type', 'application/octet-stream')
          res.set('Content-Disposition', 'attachment;filename=' + encodeURIComponent(filename))
          res.set('Content-Length', stats.size)
          if (!res.get('Last-Modified')) res.set('Last-Modified', stats.mtime.toUTCString())
          if (!res.get('Cache-Control')) {
            let cacheControl = `max-age=${(maxAge / 1000) | 0}`
            cacheControl += immutable ? ',immutable' : ''
            res.set('Cache-Control', cacheControl)
          }

          // send file
          res.body = createReadStream(filePath)
        } catch (error) {
          if (error.code === 'EACCES') {
            error.status = 403
          } else if (error.code === 'ENOENT') {
            error.status = 404
          } else {
            error.status = 500
          }
          throw error
        }
      },
    })
  }
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch (e) {
    return false
  }
}
