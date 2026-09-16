import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { matchesTextBaseline } from './repository-text.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'ui-freeze.manifest.json')
const writeMode = process.argv.includes('--write')

function walk(relative) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) return []
  const stat = fs.statSync(absolute)
  if (stat.isFile()) return [relative.replaceAll('\\', '/')]
  return fs.readdirSync(absolute, { withFileTypes: true })
    .flatMap(entry => walk(path.join(relative, entry.name)))
}

function vueVisualContent(source) {
  const template = source.match(/<template(?:\s[^>]*)?>[\s\S]*?<\/template>/g) || []
  const styles = source.match(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/g) || []
  return [...template, ...styles].join('\n')
}

function normalizedContent(relative) {
  const absolute = path.join(root, relative)
  const buffer = fs.readFileSync(absolute)
  if (relative.startsWith('pages/') && relative.endsWith('.vue')) {
    return Buffer.from(vueVisualContent(buffer.toString('utf8')).replaceAll('\r\n', '\n'))
  }
  if (relative === 'App.vue') {
    return Buffer.from(vueVisualContent(buffer.toString('utf8')).replaceAll('\r\n', '\n'))
  }
  if (/\.(vue|json|scss|css|html)$/i.test(relative)) {
    return Buffer.from(buffer.toString('utf8').replaceAll('\r\n', '\n'))
  }
  return buffer
}

const files = [
  'App.vue',
  'index.html',
  'pages.json',
  'uni.scss',
  ...walk('pages').filter(file => file.endsWith('.vue')),
  ...walk('components').filter(file => file.endsWith('.vue')),
  ...walk('static')
].filter((file, index, all) => all.indexOf(file) === index).sort()

const current = Object.fromEntries(files.map(relative => [
  relative,
  crypto.createHash('sha256').update(normalizedContent(relative)).digest('hex')
]))

if (writeMode) {
  const manifest = {
    version: 1,
    baseline: 'tests/visual-round-2/*.png',
    files: current
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`UI freeze baseline written: ${path.relative(root, manifestPath)}`)
  process.exit(0)
}

if (!fs.existsSync(manifestPath)) {
  console.error('UI freeze manifest is missing. Do not create it without explicit user approval.')
  process.exit(1)
}

const expected = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files || {}
const added = Object.keys(current).filter(file => !(file in expected))
const removed = Object.keys(expected).filter(file => !(file in current))
const changed = Object.keys(current).filter(file => {
  if (!expected[file] || expected[file] === current[file]) return false
  if (file.endsWith('.svg')) return !matchesTextBaseline(fs.readFileSync(path.join(root, file)), expected[file])
  return true
})
const passed = added.length === 0 && removed.length === 0 && changed.length === 0

console.log(JSON.stringify({ passed, added, removed, changed }, null, 2))
if (!passed) {
  console.error('Frontend UI freeze violation. Restore the approved design or obtain explicit user authorization.')
  process.exit(1)
}
