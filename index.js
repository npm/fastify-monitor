'use strict'

const Ajv = require('ajv')

const ajv = new Ajv({ useDefaults: true })
const git = require('./lib/git')

ajv.addKeyword('isFunction', {
  validate: function (value) {
    if (typeof value === 'function') {
      return true
    }

    return false
  },
  schema: false
})

module.exports = async function register (server, options, next) {
  const optionsValidator = ajv.compile({
    type: 'object',
    default: {},
    required: ['monitor'],
    properties: {
      monitor: {
        type: 'object',
        default: {},
        required: ['pingResponse', 'git', 'checks'],
        properties: {
          pingResponse: {
            type: 'string',
            default: process.env.PING_RESPONSE || 'pong'
          },
          git: {
            type: 'object',
            default: {},
            properties: {
              commit: {
                type: 'string',
                default: process.env.BUILD_COMMIT
              },
              message: {
                type: 'string',
                default: process.env.BUILD_MESSAGE
              }
            }
          },
          checks: {
            type: 'array',
            default: [],
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                fn: {
                  isFunction: true
                },
                schema: {
                  type: 'object'
                }
              },
              required: ['name', 'fn', 'schema']
            }
          }
        }
      }
    }
  })

  const valid = optionsValidator(options)
  if (!valid) {
    const err = optionsValidator.errors[0]
    err.message = `value at options${err.dataPath} ${err.message}`
    throw Object.assign(new Error(err.message), err)
  }

  if (!options.monitor.git.commit) {
    options.monitor.git.commit = await git.getCommit()
  }

  if (!options.monitor.git.message) {
    options.monitor.git.message = await git.getMessage()
  }

  const checkSchema = { type: 'object', properties: {} }
  const checkFn = () => {
    return options.monitor.checks.reduce(async (result, check) => {
      try {
        var res = await check.fn()
      } catch (err) {
        err.message = `monitor check "${check.name}" failed with: ${err.message}`
        throw err
      }
      return Object.assign(await result, { [check.name]: res })
    }, Promise.resolve({}))
  }

  for (const { name, schema } of options.monitor.checks) {
    Object.assign(checkSchema.properties, { [name]: schema })
  }

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
      await checkFn()
      return options.monitor.pingResponse
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
            },
            checks: checkSchema
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
          commit: options.monitor.git.commit,
          message: options.monitor.git.message
        },
        checks: await checkFn()
      }
    }
  })

  return next()
}
