'use strict'

const childProcess = {
  exec: function (cmd, opts, cb) {
    if (cmd === 'git rev-parse HEAD') {
      if (opts.cwd.includes('broken')) {
        return cb(new Error('Not a git repo'))
      }

      return cb(null, '123456abcdef')
    }

    if (cmd === 'git log --pretty=format:%s -n 1') {
      if (opts.cwd.includes('broken')) {
        return cb(new Error('Not a git repo'))
      }

      return cb(null, 'initial commit')
    }
  }
}

module.exports = {
  child_process: childProcess
}
