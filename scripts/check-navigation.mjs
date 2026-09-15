import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pagesConfig = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8'))
const registered = new Set((pagesConfig.pages || []).map(item => `/${item.path}`))
const errors = []

for (const page of registered) {
  const relative = page.slice(1) + '.vue'
  if (!fs.existsSync(path.join(root, relative))) errors.push(`pages.json 注册页面不存在：${relative}`)
}

const files = []
for (const directory of ['pages', 'components']) {
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) visit(absolute)
      else if (entry.name.endsWith('.vue')) files.push(absolute)
    }
  }
  visit(path.join(root, directory))
}

const literalPatterns = [
  /\burl\s*=\s*["'](\/pages\/[^"']+)["']/g,
  /\burl\s*:\s*["'](\/pages\/[^"']+)["']/g
]
for (const absolute of files) {
  const source = fs.readFileSync(absolute, 'utf8')
  for (const pattern of literalPatterns) {
    for (const match of source.matchAll(pattern)) {
      const route = match[1].split('?')[0]
      if (!registered.has(route)) errors.push(`${path.relative(root, absolute)} 引用了未注册路由：${route}`)
    }
  }
}

const result = { passed: errors.length === 0, registeredPages: registered.size, scannedFiles: files.length, errors }
console.log(JSON.stringify(result, null, 2))
if (errors.length) process.exit(1)
