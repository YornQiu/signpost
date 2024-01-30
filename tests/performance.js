/**
 * Note: You need to install the dependencies first.
 */

const Koa = require('koa')
const KoaRouter = require('koa-router')
const express = require('express')

const fastify = require('fastify')()

const Application = require('@signpost/core')
const Router = require('@signpost/router')

const koaApp = new Koa()
const koaRouter = new KoaRouter()

const exApp = express()
const exRouter = express.Router()

const sApp = new Application()
const sRouter = Router()

// 1000 static routes
for (let i = 1; i <= 1000; i++) {
  sRouter.get(`/test/${i}`, async (req, res) => (res.body = 'ok'))
  koaRouter.get(`/test/${i}`, async (ctx) => (ctx.body = 'ok'))
  exRouter.get(`/test/${i}`, (req, res) => res.send('ok'))
  fastify.get(`/test/${i}`, async (req, reply) => reply.send('ok'))
}

// 1000 dynamic routes
for (let i = 1; i <= 1000; i++) {
  sRouter.get(`/test/${i}/:id`, async (req, res) => (res.body = 'ok'))
  koaRouter.get(`/test/${i}/:id`, async (ctx) => (ctx.body = 'ok'))
  exRouter.get(`/test/${i}/:id`, (req, res) => res.send('ok'))
  fastify.get(`/test/${i}/:id`, async (req, reply) => reply.send('ok'))
}

sApp.use(sRouter.routes()).listen(9000, () => console.log(`Signpost listening at 9000`))
koaApp.use(koaRouter.routes()).listen(9001, () => console.log(`Koa listening at 9001`))
exApp.use(exRouter).listen(9002, () => console.log(`Express listening at 9002`))
fastify.listen({ port: 9003 }, () => console.log(`Fastify listening at 9003`))
