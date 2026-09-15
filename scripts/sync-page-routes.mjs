import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pages = JSON.parse(fs.readFileSync(path.join(root, 'pages.json'), 'utf8')).pages.map(item => `/${item.path}`)
const content = `${JSON.stringify(pages, null, 2)}\n`
const targets = [path.join(root, 'generated', 'page-routes.json')]
// Standalone builds must never create or modify a sibling repository implicitly.
// Opt in to backend synchronization by setting CLUB_BACKEND_ROOT.
if (process.env.CLUB_BACKEND_ROOT) {
  const backendRoot = path.resolve(process.env.CLUB_BACKEND_ROOT)
  if (!fs.existsSync(path.join(backendRoot, 'ruoyi-admin', 'pom.xml'))) {
    throw new Error('CLUB_BACKEND_ROOT must point to the sjz-club-backend repository')
  }
  targets.push(path.join(backendRoot, 'ruoyi-admin', 'src', 'main', 'resources', 'club-page-routes.json'))
}
const check = process.argv.includes('--check')

for (const target of targets) {
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) {
      console.error(`路由清单未同步：${target}`)
      process.exitCode = 1
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content, 'utf8')
  }
}
if (!process.exitCode) console.log(`路由清单已${check ? '校验' : '同步'}：${pages.length} 个页面`)
