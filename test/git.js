'use strict'

const { describe, it } = require('mocha')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const stubs = require('./stubs')
const git = proxyquire('../lib/git', stubs)

describe('git', () => {
  describe('getHash()', () => {
    it('should return a hash when given a git repo', async () => {
      const hash = await git.getHash()
      expect(hash).to.be.a('string')
      expect(hash).to.equal('123456abcdef')
    })

    it('should return "n/a" when given a directory that is not a git repo', async () => {
      const hash = await git.getHash('/broken')
      expect(hash).to.be.a('string')
      expect(hash).to.equal('n/a')
    })
  })

  describe('getMessage()', () => {
    it('should return a message when given a git repo', async () => {
      const hash = await git.getMessage()
      expect(hash).to.be.a('string')
      expect(hash).to.equal('initial commit')
    })

    it('should return "n/a" when given a directory that is not a git repo', async () => {
      const hash = await git.getMessage('/broken')
      expect(hash).to.be.a('string')
      expect(hash).to.equal('n/a')
    })
  })
})
