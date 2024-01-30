const Application = require('@signpost/core')
const router = require('@signpost/router')()

const app = new Application()

/*
 * Usage
 */

router.get('/', async function (req, res) {
  res.body = 'Hello Signpost!'
})

app.use(router.routes())

app.listen(3000)
console.log('listening at port: 3000')
