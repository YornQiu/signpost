const Application = require('../lib/core/application')
const router = require('../lib/router')()

const app = new Application()

/*
 * Usage
 */

router.get('/', async function (req, res) {
  res.body = 'Hello Vivid!'
})

app.use(router.routes())

app.listen(3000)
console.log('listening at port: 3000')
