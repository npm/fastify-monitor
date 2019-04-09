'use strict'

const { exec } = require('child_process')

module.exports = {
  getHash,
  getMessage
}

function getHash (cwd = process.cwd()) {
  return new Promise(resolve => {
    exec('git rev-parse HEAD', { cwd }, (err, stdout) => {
      let hash = 'n/a'
      if (!err) {
        hash = stdout.trim()
      }

      return resolve(hash)
    })
  })
}

function getMessage (cwd = process.cwd()) {
  return new Promise((resolve) => {
    exec('git log --pretty=format:%s -n 1', { cwd }, (err, stdout) => {
      let message = 'n/a'
      if (!err) {
        message = stdout.trim()
      }

      return resolve(message)
    })
  })
}
