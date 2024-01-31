/*
 * @Author: Yorn Qiu
 * @Date: 2022-05-23 09:55:40
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-31 15:35:00
 * @FilePath: /signpost/packages/core/application.js
 * @Description: signpost application core
 */
const EventEmitter = require('node:events')
const Stream = require('node:stream')
const http = require('node:http')
const request = require('./request')
const responce = require('./responce')

module.exports = class Application extends EventEmitter {
  constructor(options = {}) {
    super()
    this.proxy = options.proxy || false
    this.proxyIpHeader = options.proxyIpHeader || 'X-Forwarded-For'
    this.maxIpsCount = options.maxIpsCount || 0
    this.onerror = options.onerror || null
    this.middleware = []
  }

  /**
   * Create http.Server and listen on given port
   * @param  {...any} args args for http.Server.listen()
   * @returns http.Server
   */
  listen(...args) {
    return http.createServer(this.listener()).listen(...args)
  }

  /**
   * Http listeners
   */
  listener() {
    return (req, res) => {
      return this.handleRequest(request(req), responce(res))
    }
  }

  /**
   * Register middleware
   * @param {*} fn middleware
   * @returns this
   */
  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!')
    this.middleware.push(fn)
    return this
  }

  /**
   * Handle request
   * @param {http.req} req
   * @param {http.res} res
   */
  async handleRequest(req, res) {
    try {
      res.statusCode = 404
      await sequence([...this.middleware], req, res)
    } catch (error) {
      this.onerror?.(error, req, res) || handleError(error)
    }

    handleResponse(req, res)
  }
}

/**
 * Execute middleware in sequence
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
 * Handle responce.
 * In the end, we need to call res.end() to finish the response.
 * When the response is already sent, just skip it.
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
 * Handle error
 * @param {Error} err
 */
function handleError(err) {
  if (err.status === 404 || err.expose) return

  const msg = err.stack || err.toString()
  console.error(`\n${msg.replace(/^/gm, '  ')}\n`)
}
