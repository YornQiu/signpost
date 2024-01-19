const qs = require('querystring')
const getRawBody = require('./getRawBody')

/**
 * parse urlencoded
 * @param {object} options
 * @returns {object}
 */
module.exports = async function parseUrlencoded(req, options) {
  const length = req.length
  const encoding = req.headers['content-encoding']

  const data = await getRawBody(req, { length, encoding, ...options })

  try {
    return data ? qs.parse(data) : null
  } catch (error) {
    error.status = 400
    error.message = '[Parsing error]: Invalid urlencoded'
    throw error
  }
}
