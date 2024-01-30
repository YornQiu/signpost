/*
 * @Author: Yorn Qiu
 * @Date: 2022-05-23 09:55:40
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-30 11:45:25
 * @FilePath: /signpost/packages/core/application.js
 * @Description: signpost application core
 */
const EventEmitter = require('node:events')
const http = require('node:http')
const Stream = require('node:stream')
const request = require('./request')
const responce = require('./responce')

module.exports = class Application extends EventEmitter {
  constructor(options = {}) {
    super()
    this.proxy = options.proxy || false
    this.proxyIpHeader = options.proxyIpHeader || 'X-Forwarded-For'
    this.maxIpsCount = options.maxIpsCount || 0
    this.middleware = []
  }

  listen(...args) {
    return http.createServer(this.listener()).listen(...args)
  }

  listener() {
    return (req, res) => {
      return this.handleRequest(request(req), responce(res))
    }
  }

  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!')
    this.middleware.push(fn)
    return this
  }

  async handleRequest(req, res) {
    try {
      res.statusCode = 404
      await sequence([...this.middleware], req, res)
      handleResponse(req, res)
    } catch (error) {
      handleError(error)
    }
  }
}

/**
 * execute middleware in sequence
 * @param {Array<func>} handlers
 * @param {http.req} req
 * @param {http.res} res
 */
async function sequence(handlers, req, res) {
  try {
    const fn = handlers.shift()
    if (!fn) return Promise.resolve()

    await fn(req, res)
    await sequence(handlers, req, res)
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 * handle responce
 * @param {http.req} req
 * @param {http.res} res
 */
function handleResponse(req, res) {
  const { body, finished, writableEnded, writable } = res

  // responce already sent
  if (finished || writableEnded || !writable) return

  // stream pipe
  if (body instanceof Stream) {
    return body.pipe(res)
  }

  return res.end(body)
}

/**
 * handle error
 * @param {Error} err
 */
function handleError(err) {
  if (err.status === 404 || err.expose) return

  const msg = err.stack || err.toString()
  console.error(`\n${msg.replace(/^/gm, '  ')}\n`)
}
