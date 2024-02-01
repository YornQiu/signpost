# Veloc

A tiny, rapid http framework.

Similar to Express, but built with async/await, and much faster.

# Install

```
npm install veloc
```

# Usage

```
const App = require('@veloc/core')
const router = require('@veloc/router')()

const app = new App()

router.get('/', async function (req, res) {
  res.body = 'Hello Veloc!'
})

app.use(router.routes())

app.listen(3000)

```

# Performance

Performance test with autocannon

- veloc

![veloc](./images/1.png)

- koa

![koa](./images/2.png)

- express

![express](./images/3.png)

- fastify

![fastify](./images/4.png)

Veloc is faster than koa and express.

# Licence

MIT
