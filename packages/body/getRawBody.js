const bytes = require('bytes')

const supportedEncodings = ['ascii', 'utf8', 'utf16le', 'latin1', 'ucs2', 'base64', 'base64url', 'binary', 'hex']

/**
 * Get raw body of a Http stream
 * @param {stream} stream
 * @param {object} options
 * @param {number} options.length
 * @param {number|string} options.limit
 * @param {function} options.decoder
 * @param {string} options.encoding
 * @return {Promise<string>}
 */
module.exports = function getRawBody(stream, options = {}) {
  const decoder = options.decoder
  const limit = typeof options.limit === 'string' ? bytes(options.limit) : options.limit
  const length = isNaN(options.length) ? null : parseInt(options.length, 10)
  const encoding = options.encoding || 'utf8'

  if (!stream) throw TypeError('Argument stream is required')

  if (!supportedEncodings.includes(encoding) && !decoder) {
    throw TypeError(`Unsupported encoding: ${encoding}.
      Only ${supportedEncodings.join(', ')} are supported, or you can use your own decoder.
    `)
  }

  if (limit && length && length > limit) {
    const err = new Error('Request Entity Too Large')
    err.status = 413
    err.length = length
    err.limit = limit
    throw err
  }

  return readStream(stream, decoder, encoding)
}

/**
 * Read data from stream.
 * @param {object} stream
 * @param {function} decoder
 * @param {string} encoding
 * @param {function} callback
 */
function readStream(stream, decoder, encoding) {
  let data = ''

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      return decoder ? (data += decoder(chunk)) : (data += chunk.toString(encoding))
    })

    stream.on('end', (err) => {
      if (err) return reject(err)
      return resolve(data)
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}
