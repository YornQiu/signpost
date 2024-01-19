/*
 * @Author: Yorn Qiu
 * @Date: 2022-05-23 16:05:08
 * @LastEditors: Yorn Qiu
 * @LastEditTime: 2024-01-16 17:28:49
 * @FilePath: /vivid/lib/router.js
 * @Description: router
 */

/**
 * method: 'GET'
 * path: '/user'
 * route: 'GET /user'
 */

const { join } = require('node:path')
const { METHODS } = require('node:http')

const methods = METHODS || ['HEAD', 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS']

function Router(options = {}) {
  if (!(this instanceof Router)) return new Router(options)

  this.options = options
  this.methods = options.methods || methods

  this.staticRouteMap = {}
  this.dynamicRouteMap = {}
  this.middlewareList = []
  this.sequence = 0

  for (let i = 0, l = methods.length; i < l; i += 1) {
    const method = methods[i]
    this.staticRouteMap[method] = {}
    this.dynamicRouteMap[method] = {}
  }
}

for (const method of methods) {
  Router.prototype[method.toLowerCase()] = function (path, routeHandler) {
    this.registerRoute(method, path, routeHandler, this.options)

    return this
  }
}

/**
 * register routes
 * @param {string} method
 * @param {string} path
 * @param {function} routeHandler
 * @param {object} options
 * @param {string} options.prefix
 * @returns
 */
Router.prototype.registerRoute = function (method, path, routeHandler, options) {
  // set prefix
  if (options.prefix) {
    path = join(options.prefix, path)
  }

  // check whether route duplicated
  if (this.staticRouteMap[method][path] || this.dynamicRouteMap[method][path]) {
    throw new Error(`Duplicate route definition: ${method} ${path}`)
  }

  // route
  if (~path.indexOf(':')) {
    this.dynamicRouteMap[method][path] = Object.assign(
      {
        method,
        path,
        handler: routeHandler,
        sequence: this.sequence++,
        type: 'router',
      },
      transformRegexp(path)
    )

    if (method === 'GET') {
      this.dynamicRouteMap['HEAD'][path] = this.dynamicRouteMap[method][path]
    }
  } else {
    this.staticRouteMap[method][path] = {
      method,
      path,
      handler: routeHandler,
      sequence: this.sequence++,
      type: 'router',
    }

    if (method === 'GET') {
      this.staticRouteMap['HEAD'][path] = this.staticRouteMap[method][path]
    }
  }

  return this
}

/**
 * Router.use middlewares or sub routers
 * @returns
 */
Router.prototype.use = function () {
  const args = Array.from(arguments)

  // [path1, path2] or path
  if (Array.isArray(args[0]) && typeof args[0][0] === 'string') {
    const paths = args[0]
    for (let i = 0; i < paths.length; i += 1) {
      this.use.apply(this, [paths[i]].concat(args.slice(1)))
    }

    return this
  }

  const path = typeof args[0] === 'string' ? args.shift() : undefined
  const middleware = args[0]
  const options = args[1] || {}

  if (middleware instanceof Router) {
    // nested router
    this.registerNestedRouter(path, middleware)
  } else {
    this.registerMiddleware(path, middleware, { ...this.options, ...options })
  }

  return this
}

/**
 * register middlewares
 * @param {string} path
 * @param {function} middlewareHandler
 * @param {object} options
 * @param {string} options.prefix
 * @param {boolean} options.greedy in greedy mode, will match both the path and the path's child path
 * @returns
 */
Router.prototype.registerMiddleware = function (path = '', middlewareHandler, options) {
  // set prefix
  if (options.prefix) {
    path = join(options.prefix, path)
  }

  const rawPath = path

  if (options.greedy || path === '') {
    path = join(path, '(.*)')
  }

  let regexp
  if (~path.indexOf(':')) {
    regexp = transformRegexp(path).regexp
  } else {
    regexp = new RegExp(`^${path}$`)
  }

  this.middlewareList.push({
    path: rawPath,
    handler: middlewareHandler,
    sequence: this.sequence++,
    type: 'middleware',
    regexp,
  })

  return this
}

/**
 * register sub router
 * @param {string} path
 * @param {Router} router
 */
Router.prototype.registerNestedRouter = function (path, router) {
  path = path ? path.replace(/\/$/, '') : ''

  const { routeMap, middlewareList } = router
  const options = { ...router.options, prefix: '', ...this.options }

  const list = Object.values(routeMap).concat(middlewareList)

  list
    .sort((p, n) => p.sequence - n.sequence)
    .forEach((item) => {
      if (item.type === 'router') {
        this.registerRoute(item.method, join(path, item.path), item.handler, options)
      } else {
        this.registerMiddleware(join(path, item.path), item.handler, options)
      }
    })

  return this
}

/**
 * return route matched the request to koa
 */
Router.prototype.routes = function () {
  const router = this

  return async function (req, res) {
    const { method, path } = req
    const matched = router.match(method, path)

    const { path: matchedPath, hasParams, routers } = matched

    if (!matchedPath) return // if no route layer matched, just skip

    if (hasParams) {
      const matchedRouter = router.dynamicRouteMap[method][matchedPath]
      req.params = parseParams(path, matchedRouter.regexp, matchedRouter.params)
    }

    const handlers = routers.map((e) => e.handler)

    await sequence(handlers, req, res)
  }
}

Router.prototype.match = function (method, path) {
  const { staticRouteMap, dynamicRouteMap, middlewareList } = this

  const matched = {
    routers: [],
    path: null,
    method: null,
  }

  // match routers, find the exact one, if dosen't exist, match the dynamic route
  if (staticRouteMap[method][path]) {
    matched.path = path
    matched.method = method
    matched.routers.push(staticRouteMap[method][path])
  } else {
    const dynamicRoutes = Object.values(dynamicRouteMap[method])

    for (const routeItem of dynamicRoutes) {
      const { path: dynamicPath, regexp } = routeItem
      if (regexp.test(path)) {
        matched.path = dynamicPath
        matched.method = method
        matched.hasParams = true
        matched.routers.push(routeItem)
        break
      }
    }
  }

  // match middlewares, need no method
  for (const middleware of middlewareList) {
    const { regexp } = middleware
    if (regexp && regexp.test(path)) {
      matched.routers.push(middleware)
    }
  }

  matched.routers.sort((p, n) => p.sequence - n.sequence)

  return matched
}

/**
 * set prefix，will be applied to all routes, middlewares and sub routers below
 * @param {string} prefix
 */
Router.prototype.prefix = function (prefix) {
  if (!prefix || typeof prefix !== 'string') {
    throw new Error(`prefix must be non-empty string: ${prefix}`)
  }
  this.options.prefix = prefix.replace(/\/$/, '')
}

/**
 * parse params from path
 * @param {string} path
 * @param {Regexp} regexp
 * @param {string[]} paramNames
 * @returns {object}
 */
function parseParams(path, regexp, paramNames) {
  const params = {}
  const result = regexp.exec(path)

  let index = 1
  for (let i = 0, l = paramNames.length; i < l; i += 1) {
    const name = paramNames[i]
    params[name] = result[index++]
  }

  return params
}

/**
 * transform path to regexp and extract param names from path
 * @param {string} path
 * @returns {object}
 */
function transformRegexp(path) {
  const strArr = path.split(/:([^/:]+)/g)

  let reg = ''
  const params = []
  for (let i = 0, l = strArr.length; i < l; i += 1) {
    const str = strArr[i]
    if (i % 2) {
      const result = str.match(/\((.+)\)/g)
      if (result) {
        reg += result
        params.push(str.replace(/\(.+\)/, ''))
      } else {
        reg += '(.+?)'
        params.push(str)
      }
    } else {
      reg += str
    }
  }

  return {
    params,
    regexp: new RegExp(`^${reg}$`),
  }
}

/**
 * execute router handler in sequence
 * @param {Array<func>} handlers
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

module.exports = Router
