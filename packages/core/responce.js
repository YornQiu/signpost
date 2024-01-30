const assert = require('node:assert')
const Stream = require('node:stream')
const { STATUS_CODES } = require('node:http')

/**
 * Parse Responce
 * @param {http.res} res
 * @returns
 */
module.exports = function responce(res) {
  /**
   * Shorthand for getHeader.
   * Return response header.
   */
  defineValue(res, 'get', function get(field) {
    return res.getHeader(field)
  })

  /**
   * Shorthand for hasHeader.
   */
  defineValue(res, 'has', function has(field) {
    return res.hasHeader(field)
  })

  /**
   * Set header `field` to `val` or pass an object of header fields.
   */
  defineValue(res, 'set', function set(field, val) {
    if (res.headerSent) return

    if (typeof field === 'object') {
      for (const key in field) {
        res.set(key, field[key])
      }
    } else {
      if (Array.isArray(val)) {
        res.setHeader(
          field,
          val.map((v) => String(v))
        )
      }
      res.setHeader(field, String(val))
    }
  })

  /**
   * Append additional header `field` with value `val`.
   */
  defineValue(res, 'append', function append(field, val) {
    const prev = res.get(field)

    if (prev) {
      val = Array.isArray(prev) ? prev.concat(val) : [prev].concat(val)
    }

    return res.set(field, val)
  })

  /**
   * Remove header `field`.
   */
  defineValue(res, 'remove', function remove(field) {
    if (res.headerSent) return
    res.removeHeader(field)
  })

  /**
   * Content-length
   */
  Object.defineProperty(res, 'length', {
    configurable: true,
    enumerable: true,
    get: function () {
      if (res.has('Content-Length')) {
        return parseInt(res.get('Content-Length'), 10) || 0
      }

      const { body } = res
      if (!body || body instanceof Stream) return undefined
      if (typeof body === 'string') return Buffer.byteLength(body)
      if (Buffer.isBuffer(body)) return body.length
      return Buffer.byteLength(JSON.stringify(body))
    },
    set: function (val) {
      if (!res.has('Transfer-Encoding')) {
        res.set('Content-Length', val)
      }
    },
  })

  /**
   * Content-type
   */
  Object.defineProperty(res, 'type', {
    configurable: true,
    enumerable: true,
    get: function () {
      return res.get('Content-Type')
    },
    set: function (val) {
      res.set('Content-Type', val)
    },
  })

  /**
   * status, same as statusCode
   */
  Object.defineProperty(res, 'status', {
    configurable: true,
    enumerable: true,
    get: function () {
      return res.statusCode
    },
    set: function (val) {
      if (res.headerSent) return

      assert(Number.isInteger(val), 'status code must be a number')
      assert(val >= 100 && val <= 999, `invalid status code: ${val}`)

      res.statusCode = val
      res.statusMessage = STATUS_CODES[val]
    },
  })

  /**
   * message, same as statusMessage
   */
  Object.defineProperty(res, 'message', {
    configurable: true,
    enumerable: true,
    get: function () {
      return res.statusMessage
    },
    set: function (message) {
      res.statusMessage = message
    },
  })

  /**
   * body
   * when setting body, the status should be automatically changed to 200 or 204
   */
  Object.defineProperty(res, 'body', {
    configurable: true,
    enumerable: true,
    get: function () {
      return res._body
    },
    set: function (val) {
      // no content
      if (val == null) {
        res.remove('Content-Type')
        res.remove('Content-Length')
        res.remove('Transfer-Encoding')
        res.status = 204

        return
      }

      // string
      if (typeof val === 'string') {
        res.type = /^\s*</.test(val) ? 'text/html; charset=UTF-8' : 'text/plain; charset=UTF-8'
        res.length = Buffer.byteLength(val)
      }

      // buffer
      if (Buffer.isBuffer(val)) {
        res.type = 'application/octet-stream; charset=UTF-8'
        res.length = val.length
      }

      // stream
      if (val instanceof Stream) {
        res.type = 'application/octet-stream; charset=UTF-8'
      }

      // json
      val = JSON.stringify(val)
      res.type = 'application/json; charset=UTF-8'
      res.length = Buffer.byteLength(val)

      // update statusCode while setting responce body
      res.status = 200
      res._body = val
    },
  })

  return res
}

/**
 * Helper function for creating a setter on an object.
 * @param {Object} obj
 * @param {String} name
 * @param {Function} setter
 * @private
 */
function defineValue(obj, name, value) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    value,
  })
}
