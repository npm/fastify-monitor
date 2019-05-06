'use strict'

const { describe, it } = require('mocha')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const stubs = require('./stubs')
const git = proxyquire('../lib/git', stubs)

describe('git', () => {
  describe('getCommit()', () => {
    it('should return a commit when given a git repo', async () => {
      const commit = await git.getCommit()
      expect(commit).to.be.a('string')
      expect(commit).to.equal('123456abcdef')
    })

    it('should return "n/a" when given a directory that is not a git repo', async () => {
      const commit = await git.getCommit('/broken')
      expect(commit).to.be.a('string')
      expect(commit).to.equal('n/a')
    })
  })

  describe('getMessage()', () => {
    it('should return a message when given a git repo', async () => {
      const msg = await git.getMessage()
      expect(msg).to.be.a('string')
      expect(msg).to.equal('initial commit')
    })

    it('should return "n/a" when given a directory that is not a git repo', async () => {
      const msg = await git.getMessage('/broken')
      expect(msg).to.be.a('string')
      expect(msg).to.equal('n/a')
    })
  })
})
