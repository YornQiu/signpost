# Vivid

A tiny, rapid http framework.

Similar to Express, but built with async/await, and much faster.

# Install

```
npm install vivid
```

# Usage

```
const Vivid = require('@vivid/core')
const router = require('@vivid/router')()

const app = new Vivid()

router.get('/', async function (req, res) {
  res.body = 'Hello Vivid!'
})

app.use(router.routes())

app.listen(3000)

```

# Performance

Performance test with autocannon

- vivid

![vivid](./images/1.png)

- koa

![koa](./images/2.png)

- express

![express](./images/3.png)

- fastify

![fastify](./images/4.png)

Signpost is faster than koa and express.

# Licence

MIT
