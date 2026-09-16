import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesTextBaseline, normalizeLineEndings, sha256 } from './repository-text.mjs'

const lf = '<svg>\n<path fill="green"/>\n</svg>\n'
const crlf = lf.replaceAll('\n', '\r\n')
test('approved SVG hashes accept only LF/CRLF checkout differences', () => {
  assert.ok(matchesTextBaseline(Buffer.from(lf), sha256(crlf)))
  assert.ok(matchesTextBaseline(Buffer.from(crlf), sha256(lf)))
})
test('SVG content changes still fail against the approved baseline', () => {
  assert.equal(matchesTextBaseline(Buffer.from(lf.replace('green', 'red')), sha256(crlf)), false)
  assert.equal(matchesTextBaseline(Buffer.from(lf + '<script/>'), sha256(crlf)), false)
})
test('route text tolerates Windows line endings but preserves route changes', () => {
  const routes='[\n  "/pages/index/index"\n]\n'
  assert.equal(normalizeLineEndings(routes.replaceAll('\n', '\r\n')), routes)
  assert.notEqual(normalizeLineEndings(routes.replace('index/index', 'missing/index')), routes)
})
