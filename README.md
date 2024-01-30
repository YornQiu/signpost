# Signpost

A tiny, rapid http framework.

Similar to Express, but built with async/await, and much faster.

# Install

```
npm install signpost
```

# Usage

```
const App = require('@signpost/core')
const router = require('@signpost/router')()

const app = new App()

router.get('/', async function (req, res) {
  res.body = 'Hello Signpost!'
})

app.use(router.routes())

app.listen(3000)

```

# Performance

Performance test with autocannon

- signpost

![signpost](./images/1.png)

- koa

![koa](./images/2.png)

- express

![express](./images/3.png)

- fastify

![fastify](./images/4.png)

Signpost is faster than koa and express.

# Licence

MIT
