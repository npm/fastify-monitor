'use strict'

const { describe, it } = require('mocha')
const { expect } = require('chai')
const proxyquire = require('proxyquire')
const fastify = require('fastify')

const stubs = require('./stubs')
const git = proxyquire('../lib/git', stubs)
const plugin = proxyquire('../', { './lib/git': git })

describe('plugin', () => {
  describe('validation', () => {
    it('throws when options are invalid', async () => {
      const server = fastify()
      server.register(plugin, { app: 'test-app', monitor: { checks: [{ name: 'fake', fn: 'not a function', schema: {} }] } })
      const err = await server.ready().then(() => null).catch(err => err)
      expect(err).to.be.an.instanceof(Error)
    })
  })

  describe('/_monitor/ping', () => {
    it('responds', async () => {
      const server = fastify()
      server.register(plugin, { app: 'test-app' })
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/ping' })
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.equal('pong')
    })

    it('responds with custom message via environment variable', async () => {
      process.env.PING_RESPONSE = 'hi from the environment'
      const server = fastify()
      server.register(plugin, { app: 'test-app' })
      await server.ready()
      delete process.env.PING_RESPONSE

      const res = await server.inject({ method: 'GET', url: '/_monitor/ping' })
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.equal('hi from the environment')
    })

    it('responds with custom message via options', async () => {
      const server = fastify()
      server.register(plugin, { app: 'test-app', monitor: { pingResponse: 'hi from options' } })
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/ping' })
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.equal('hi from options')
    })
  })

  describe('/_monitor/status', () => {
    it('responds', async () => {
      const server = fastify()
      server.register(plugin, { app: 'test-app' })
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.app).to.equal('test-app')
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.be.a('string')
      expect(parsed.git.message).to.be.a('string')
      expect(parsed.mem).to.be.an('object')
      expect(parsed.checks).to.be.an('object')
    })

    it('uses git variables from environment variables', async () => {
      process.env.BUILD_COMMIT = '321cba'
      process.env.BUILD_MESSAGE = 'hi from the environment'
      const server = fastify()
      server.register(plugin, { app: 'test-app' })
      await server.ready()
      delete process.env.BUILD_COMMIT
      delete process.env.BUILD_MESSAGE

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.app).to.equal('test-app')
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.equal('321cba')
      expect(parsed.git.message).to.equal('hi from the environment')
      expect(parsed.mem).to.be.an('object')
      expect(parsed.checks).to.be.an('object')
    })

    it('uses git variables from options', async () => {
      const server = fastify()
      server.register(plugin, { app: 'test-app', monitor: { git: { commit: 'def456', message: 'hi from options' } } })
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.app).to.equal('test-app')
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.equal('def456')
      expect(parsed.git.message).to.equal('hi from options')
      expect(parsed.mem).to.be.an('object')
      expect(parsed.checks).to.be.an('object')
    })

    it('omits app when not provided', async () => {
      const server = fastify()
      server.register(plugin)
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.app).to.equal(undefined)
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.be.a('string')
      expect(parsed.git.message).to.be.a('string')
      expect(parsed.mem).to.be.an('object')
      expect(parsed.checks).to.be.an('object')
    })

    it('appends successful check results to response', async () => {
      const server = fastify()
      server.register(plugin, {
        app: 'test-app',
        monitor: {
          checks: [{
            name: 'fake',
            fn: () => 'yup, still fake',
            schema: {
              type: 'string'
            }
          }, {
            name: 'faker',
            fn: async () => ({ some: 'fake data' }),
            schema: {
              type: 'object',
              properties: {
                some: {
                  type: 'string'
                }
              }
            }
          }]
        }
      })

      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.app).to.equal('test-app')
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.be.a('string')
      expect(parsed.git.message).to.be.a('string')
      expect(parsed.mem).to.be.an('object')
      expect(parsed.checks).to.be.an('object')
      expect(parsed.checks.fake).to.equal('yup, still fake')
      expect(parsed.checks.faker).to.be.an('object')
      expect(parsed.checks.faker.some).to.equal('fake data')
    })

    it('responds with a 500 when any check fails', async () => {
      const server = fastify()
      server.register(plugin, {
        app: 'test-app',
        monitor: {
          checks: [{
            name: 'fake',
            fn: () => {
              throw new Error('nope, broken')
            },
            schema: {
              type: 'string'
            }
          }]
        }
      })

      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(500)
      const parsed = JSON.parse(res.body)
      expect(parsed.message).to.equal('monitor check "fake" failed with: nope, broken')
    })
  })
})
