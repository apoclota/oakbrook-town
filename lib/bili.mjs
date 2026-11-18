// 小屋电视的节目单：拉一轮 B 站（bili.exe），失败就回落成本地点播台。
import { execFile } from 'node:child_process'

const BILI = process.env.TOWN_BILI_BIN || 'C:\\Users\\26102\\.local\\bin\\bili.exe'
const CACHE_MS = 10 * 60 * 1000
const TIMEOUT_MS = Number(process.env.TOWN_BILI_TIMEOUT || 25000)
let cache = { at: 0, feed: null }

const FALLBACK = [
  { title: '湖上天气：明天适不适合晒被子', author: '镇上点播台', minutes: 6, desc: '每晚七点的本地天气，顺带说说湖面的风。' },
  { title: '橡溪镇的老房子（一）：面包房的砖烤炉', author: '镇上点播台', minutes: 12, desc: '塞德带着镜头看砖缝里的年份。' },
  { title: '十分钟学做一碗热汤', author: '镇上点播台', minutes: 9, desc: '餐厅后厨教你怎么把剩菜变成汤。' },
  { title: '月镜湖的傍晚', author: '镇上点播台', minutes: 15, desc: '没有旁白，只有水声和风。' },
  { title: '旧收音机修理指南', author: '镇上点播台', minutes: 11, desc: '五金铺老板的土办法。' },
  { title: '花店的一周花材', author: '镇上点播台', minutes: 8, desc: '莉娜说这一周哪些花最耐放。' }
].map((v, i) => ({ ...v, bvid: 'local-' + (i + 1), url: '', source: 'local' }))

function fmtDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  return Math.floor(total / 60) + ':' + String(Math.floor(total % 60)).padStart(2, '0')
}

function normalize(items, source) {
  return (Array.isArray(items) ? items : [])
    .filter(it => it && it.title)
    .slice(0, 12)
    .map(it => ({
      bvid: String(it.bvid || ''),
      title: String(it.title).slice(0, 80),
      author: String(it.author?.name || it.owner?.name || ''),
      minutes: Math.max(1, Math.round((Number(it.duration) || 0) / 60)),
      duration: fmtDuration(it.duration),
      views: Number(it.stat?.view || 0),
      desc: String(it.desc || it.reason || '').slice(0, 120),
      url: it.url || (it.bvid ? 'https://www.bilibili.com/video/' + it.bvid : ''),
      source
    }))
}

function runBili(args) {
  return new Promise(resolve => {
    const env = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    if (!env.HTTPS_PROXY && !env.https_proxy) env.HTTPS_PROXY = 'http://127.0.0.1:7897'
    execFile(BILI, args, { timeout: TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024, env, windowsHide: true }, (error, stdout) => {
      if (error) return resolve({ error: error.message })
      const text = String(stdout || '').replace(/^\uFEFF/, '').trim()
      try {
        return resolve(JSON.parse(text))
      } catch {
        return resolve({ error: 'unparsable output' })
      }
    })
  })
}

export async function tvFeed(force = false) {
  const now = Date.now()
  if (!force && cache.feed && now - cache.at < CACHE_MS) return cache.feed
  const attempts = [['--compact', 'feed', 'recommend'], ['--compact', 'hot', 'popular']]
  for (const args of attempts) {
    const out = await runBili(args)
    const items = out?.data?.items || []
    if (Array.isArray(items) && items.length) {
      const feed = { ok: true, source: args[2] === 'recommend' ? 'bili-recommend' : 'bili-hot', at: new Date().toISOString(), videos: normalize(items, 'bili') }
      cache = { at: now, feed }
      return feed
    }
  }
  const feed = { ok: true, source: 'local', at: new Date().toISOString(), videos: FALLBACK, error: 'bili 暂时没信号，播的是镇上点播台。' }
  cache = { at: now, feed }
  return feed
}
