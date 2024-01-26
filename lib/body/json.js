const getRawBody = require('./getRawBody')

/**
 * parse JSON
 * @param {object} options
 * @returns {object}
 */
module.exports = async function parseJSON(req, options) {
  const length = req.length
  const encoding = req.encoding

  const data = await getRawBody(req, { length, encoding, ...options })

  try {
    return data ? JSON.parse(data) : null
  } catch (error) {
    error.status = 400
    error.message = '[Parsing error]: Invalid JSON, only object and array allowed'
    throw error
  }
}
