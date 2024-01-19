/*
 * @Author: Yorn Qiu
 * @Date: 2022-05-25 18:12:46
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-17 16:18:29
 * @FilePath: /vivid/lib/cors.js
 * @Description: cors
 */

const Headers = {
  AccessControlRequestMethod: 'Access-Control-Request-Method',
  AccessControlAllowHeaders: 'Access-Control-Allow-Headers',
  AccessControlAllowMethods: 'Access-Control-Allow-Methods',
  AccessControlAllowOrigin: 'Access-Control-Allow-Origin',
  AccessControlAllowCredentials: 'Access-Control-Allow-Credentials',
  AccessControlMaxAge: 'Access-Control-Max-Age',
  AccessControlExposeHeaders: 'Access-Control-Expose-Headers',
  CrossOriginOpenerPolicy: 'Cross-Origin-Opener-Policy',
  CrossOriginEmbedderPolicy: 'Cross-Origin-Embedder-Policy',
  AccessControlAllowPrivateNetwork: 'Access-Control-Allow-Private-Network',
  AccessControlRequestPrivateNetwork: 'Access-Control-Request-Private-Network',
}

/**
 * @param {object} globalOptions
 * @param {string|Function} globalOptions.origin Access-Control-Allow-Origin. Default is request's origin
 * @param {boolean|Function} globalOptions.credentials Access-Control-Allow-Credentials.
 * @param {number} globalOptions.maxAge Access-Control-Max-Age.
 * @param {string|string[]} globalOptions.allowHeaders Access-Control-Allow-Methods. Default is requrest's Access-Control-Request-Headers
 * @param {string|string[]} globalOptions.allowMethods Access-Control-Allow-Headers. Default is GET,PUT,HEAD,POST,DELETE,PATCH
 * @param {string|string[]} globalOptions.exposeHeaders Access-Control-Expose-Headers.
 * @param {boolean} globalOptions.secureContext  Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy. Default is false
 * @param {boolean} globalOptions.privateNetworkAccess Access-Control-Allow-Private-Network. Default is false
 * @returns
 */
module.exports = function (globalOptions) {
  const defaults = {
    allowMethods: 'GET,PUT,HEAD,POST,DELETE,PATCH',
    secureContext: false,
  }

  const options = { ...defaults, ...globalOptions }

  return async function cors(req, res) {
    let origin
    if (typeof options.origin === 'function') {
      origin = await options.origin(req)
      if (!origin) return
    } else {
      origin = options.origin || '*'
    }

    let credentials
    if (typeof options.credentials === 'function') {
      credentials = await options.credentials(req)
    } else {
      credentials = !!options.credentials
    }

    if (credentials && origin === '*') {
      origin = req.origin
    }

    const {
      maxAge,
      allowMethods,
      allowHeaders = req.get('Access-Control-Request-Headers'),
      exposeHeaders,
      secureContext,
      privateNetworkAccess,
    } = options

    if (req.method === 'OPTIONS') {
      // preflight request method is required
      if (!req.get(Headers.AccessControlRequestMethod)) return

      res.set(Headers.AccessControlAllowOrigin, origin)

      if (credentials) res.set(Headers.AccessControlAllowCredentials, 'true')

      if (maxAge) res.set(Headers.AccessControlMaxAge, String(maxAge))

      if (privateNetworkAccess && req.get(Headers.AccessControlRequestPrivateNetwork))
        res.set(Headers.AccessControlAllowPrivateNetwork, 'true')

      if (allowMethods)
        res.set(Headers.AccessControlAllowMethods, Array.isArray(allowMethods) ? allowMethods.join(',') : allowMethods)

      if (allowHeaders)
        res.set(Headers.AccessControlAllowHeaders, Array.isArray(allowHeaders) ? allowHeaders.join(',') : allowHeaders)

      if (secureContext) {
        res.set(Headers.CrossOriginOpenerPolicy, 'same-origin')
        res.set(Headers.CrossOriginEmbedderPolicy, 'require-corp')
      }

      res.status = 204
    } else {
      res.set(Headers.AccessControlAllowOrigin, origin)

      if (credentials) res.set(Headers.AccessControlAllowCredentials, 'true')

      if (exposeHeaders)
        res.set(
          Headers.AccessControlExposeHeaders,
          Array.isArray(exposeHeaders) ? exposeHeaders.join(',') : exposeHeaders
        )

      if (secureContext) {
        res.set(Headers.CrossOriginOpenerPolicy, 'same-origin')
        res.set(Headers.CrossOriginEmbedderPolicy, 'require-corp')
      }
    }
  }
}
