## @npmcorp/fastify-monitor

This is a [fastify](https://www.fastify.io) plugin to provide some simple monitoring endpoints for microservices.

### Environment variables

This plugin accepts the following environment variables to override default behavior:

- `BUILD_HASH`: the commit hash of the current build
- `BUILD_MESSAGE`: the commit message of the current build

### Options

The following properties may be passed when registering the plugin:

- `name`: a string used as an identifier for the microservice, will be returned as part of the status payload

### Routes

#### GET `/_monitor/ping`

Returns the string `'pong'`. Does nothing else.

#### GET `/_monitor/status`

Returns an object containing the following fields:
- `name`: copied from the options when loading the plugin, will be omitted from response if not defined
- `pid`: the running process pid `process.pid`
- `uptime`: the uptime of the running process `process.uptime()`
- `mem`: an object representing the memory usage of the running process `process.memoryUsage()`
- `git`: an object representing the current build's commit, contains the following properties:
  * `commit`: the hash of the current commit as retrieved by `git rev-parse HEAD` (can be overridden by setting `BUILD_HASH`)
  * `message`: the message of the current commit as retrieved by `git log --pretty=format:%s -n 1` (can be overridden by setting `BUILD_MESSAGE`)
