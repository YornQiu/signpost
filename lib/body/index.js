const parseJSON = require('./json')
const parseUrlencoded = require('./urlencoded')
const parseText = require('./text')
const parseMultipart = require('./multipart')

const reqType = {
  Json: 'json',
  Urlencoded: 'urlencoded',
  Text: 'text',
  Multipart: 'multipart',
}

/**
 * body parser
 * @param {object} options
 * @param {number|string} options.jsonLimit json size limit, default 1MB
 * @param {number|string} options.formLimit form size limit, default 56KB
 * @param {number|string} options.textLimit text size limit, default 56KB
 * @param {string} options.encoding default encoding, 'utf-8
 * @param {number} options.formidable options for formidable
 * @param {function} options.decoder decoder to parse body stream
 * @returns
 */
module.exports = function (options) {
  return async function (req) {
    const type = getType(req.type)
    const { jsonLimit, formLimit, textLimit, formidable, encoding, decoder } = options

    switch (type) {
      case reqType.Json:
        req.body = await parseJSON(req, { limit: jsonLimit, encoding, decoder })
        break
      case reqType.Urlencoded:
        req.body = await parseUrlencoded(req, { limit: formLimit, encoding, decoder })
        break
      case reqType.Text:
        req.body = await parseText(req, { limit: textLimit, encoding, decoder })
        break
      case reqType.Multipart:
        req.body = await parseMultipart(req, { formidable: formidable, encoding, decoder })
        break

      default: {
        const err = new TypeError(`Unsupported Media Type: ${type}`)
        err.status = 415
        err.type = type
        throw err
      }
    }
  }
}

/**
 * return common type from given mime-type
 * @param {string} type mime-type
 * @returns {string} type
 */
function getType(type) {
  const jsonTypes = [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
    'application/reports+json',
  ]

  const urlencodedTypes = ['application/x-www-form-urlencoded']

  if (jsonTypes.includes(type)) {
    return reqType.Json
  }

  if (urlencodedTypes.includes(type)) {
    return reqType.Urlencoded
  }

  if (/text\/*/.test(type)) {
    return reqType.Text
  }

  if (/multipart\/*/.test(type)) {
    return reqType.Multipart
  }

  return type
}
