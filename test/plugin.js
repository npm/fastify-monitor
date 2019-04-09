'use strict'

const { describe, it } = require('mocha')
const { expect } = require('chai')
const proxyquire = require('proxyquire')
const fastify = require('fastify')

const stubs = require('./stubs')
const git = proxyquire('../lib/git', stubs)
const plugin = proxyquire('../', { './lib/git': git })

describe('plugin', () => {
  describe('/_monitor/ping', () => {
    it('responds', async () => {
      const server = fastify()
      server.register(plugin, { name: 'test-app' })
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/ping' })
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.equal('pong')
    })
  })

  describe('/_monitor/status', () => {
    it('responds', async () => {
      const server = fastify()
      server.register(plugin, { name: 'test-app' })
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.name).to.equal('test-app')
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.be.a('string')
      expect(parsed.git.message).to.be.a('string')
      expect(parsed.mem).to.be.an('object')
    })

    it('omits name when not provided', async () => {
      const server = fastify()
      server.register(plugin)
      await server.ready()

      const res = await server.inject({ method: 'GET', url: '/_monitor/status' })
      expect(res.statusCode).to.equal(200)
      const parsed = JSON.parse(res.body)
      expect(parsed.name).to.equal(undefined)
      expect(parsed.pid).to.be.a('number')
      expect(parsed.uptime).to.be.a('number')
      expect(parsed.git).to.be.an('object')
      expect(parsed.git.commit).to.be.a('string')
      expect(parsed.git.message).to.be.a('string')
      expect(parsed.mem).to.be.an('object')
    })
  })
})
