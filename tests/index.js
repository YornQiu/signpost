const Application = require('@veloc/core')
const router = require('@veloc/router')()

const app = new Application()

/*
 * Usage
 */

router.get('/', async function (req, res) {
  res.body = 'Hello Veloc!'
})

app.use(router.routes())

app.listen(3000)
console.log('listening at port: 3000')
