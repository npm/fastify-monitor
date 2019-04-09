'use strict'

const git = require('./lib/git')

module.exports = async function register (server, options, next) {
  server.route({
    method: 'GET',
    url: '/_monitor/ping',
    schema: {
      response: {
        200: {
          type: 'string'
        }
      }
    },
    handler: async function pingHandler (request, reply) {
      return 'pong'
    }
  })

  server.route({
    method: 'GET',
    url: '/_monitor/status',
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            app: { type: 'string' },
            pid: { type: 'number' },
            uptime: { type: 'number' },
            mem: {
              type: 'object',
              properties: {
                rss: { type: 'number' },
                heapTotal: { type: 'number' },
                heapUsage: { type: 'number' },
                external: { type: 'number' }
              }
            },
            git: {
              type: 'object',
              properties: {
                commit: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async function statusHandler (request, reply) {
      return {
        app: options.app,
        pid: process.pid,
        uptime: process.uptime(),
        mem: process.memoryUsage(),
        git: {
          commit: gitState.hash,
          message: gitState.message
        }
      }
    }
  })

  const gitState = {
    hash: process.env.BUILD_HASH || await git.getHash(),
    message: process.env.BUILD_MESSAGE || await git.getMessage()
  }

  return next()
}
