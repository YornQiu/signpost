const formidable = require('formidable')
/**
 * parse multipart
 * @param {options} options
 * @returns {object}
 */
module.exports = async function parseMultipart(req, options) {
  const length = req.length
  const encoding = req.headers['content-encoding']

  return await parseForm(req, { length, encoding, ...options })
}

/**
 * parse form data and files
 * @param  {stream} ctx
 * @param  {object} options
 * @return {promise}
 */
function parseForm(req, options) {
  return new Promise(function (resolve, reject) {
    const fields = {}
    const files = {}
    const form = formidable(options)
    form
      .on('end', function () {
        return resolve({ fields, files })
      })
      .on('error', function (err) {
        return reject(err)
      })
      .on('field', function (field, value) {
        if (fields[field]) {
          if (Array.isArray(fields[field])) {
            fields[field].push(value)
          } else {
            fields[field] = [fields[field], value]
          }
        } else {
          fields[field] = value
        }
      })
      .on('file', function (field, file) {
        if (files[field]) {
          if (Array.isArray(files[field])) {
            files[field].push(file)
          } else {
            files[field] = [files[field], file]
          }
        } else {
          files[field] = file
        }
      })

    if (options.onFileBegin) {
      form.on('fileBegin', options.onFileBegin)
    }

    form.parse(req)
  })
}
