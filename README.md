## @npmcorp/fastify-monitor

This is a [fastify](https://www.fastify.io) plugin to provide some simple monitoring endpoints for microservices.

### Environment variables

This plugin accepts the following environment variables to override default behavior:

- `PING_RESPONSE`: the string resonse to send for a successful `/_monitor/ping` request
- `BUILD_COMMIT`: the commit hash of the current build
- `BUILD_MESSAGE`: the commit message of the current build

### Options

The following properties may be passed when registering the plugin:

- `app`: a string used as an identifier for the microservice, will be returned as part of the status payload
- `monitor`:
  - `pingResponse`: override the default `"pong"` (or `PING_RESPONSE`)
  - `git`:
    - `commit`: override the commit hash
    - `message`: override the commit message
  - `checks`: an array of additional checks to run

#### Checks

You may register additional checks to be performed each time either route is called. These checks are specified as an object with the following properties:

- `name`: the name of your check, this will be used in the status response
- `fn`: the function that performs your check, this may return a promise or a value directly
- `schema`: the response schema for a successful run

A simple example would look like:

```js
server.register(monitor, {
  checks: [{
    name: 'simple',
    fn: () => {
      return { some: 'data' }
    },
    schema: {
      type: 'object',
      properties: {
        some: {
          type: 'string'
        }
      }
    }
  }]
})
```

### Routes

#### GET `/_monitor/ping`

Performs all configured checks.

If successful, returns a `200` status code with the string specified by `PING_RESPONSE`, `options.monitor.pingResponse` or the default `'pong'`.

If any check throws or rejects, returns a `500` status code with a JSON response.

#### GET `/_monitor/status`

Performs all configured checks.

If successful, returns a `200` status code with an object containing the following fields:
- `app`: copied from the options when loading the plugin, will be omitted from response if not defined
- `pid`: the running process pid `process.pid`
- `uptime`: the uptime of the running process `process.uptime()`
- `mem`: an object representing the memory usage of the running process `process.memoryUsage()`
- `git`: an object representing the current build's commit, contains the following properties:
  * `commit`: the hash of the current commit as retrieved by `git rev-parse HEAD` (can be overridden by setting `BUILD_COMMIT`, or passing `options.monitor.git.commit`)
  * `message`: the message of the current commit as retrieved by `git log --pretty=format:%s -n 1` (can be overridden by setting `BUILD_MESSAGE` or passing `options.monitor.git.message`)
- `checks`: an object containing success statuses for every check run, each top level property will be the name of a check and its value the response from the check

If any check throws or rejects, returns a `500` status code with a JSON response.
