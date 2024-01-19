const getRawBody = require('./getRawBody')

/**
 * parse text
 * @param {object} options
 * @returns {string}
 */
module.exports = async function parseText(req, options) {
  const { length, encoding } = req

  return await getRawBody(req, { length, encoding, ...options })
}
