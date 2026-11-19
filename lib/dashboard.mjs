import http from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { status, act, buy, travel, enter, decorate, work, rest, eat, sell, plant, waterField, harvest, npcTalk, npcGift, eventSuggestion, acceptTask, rerollTasks, setAutoPilot, watchTV, invite, dineAt, cancelAppointment, treat, buyLottery, resolveSpecialEvent } from './state.mjs'
import { tvFeed } from './bili.mjs'

const port = Number(process.env.TOWN_PORT || 18763)
const host = '127.0.0.1'
const address = host + ':' + port
export const dashboardUrl = 'http://' + address + '/'
const pageFile = new URL('./town.html', import.meta.url)
const mapFile = new URL('./oakbrook.webp', import.meta.url)
const send = (res, code, value) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(value))
}
export function startDashboard(config = { stateFile: process.env.DSH_TOWN_LIFE_FILE || process.env.TOWN_STATE_FILE }) {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Frame-Options', 'DENY')
    if (req.headers.host !== address) return send(res, 403, {})
    try {
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        const html = readFileSync(pageFile, 'utf8').replace('window.TOWN_REFRESH_SECONDS||2', String(Math.max(1, Number(config.mapRefreshSeconds) || 2)))
        return res.end(html.replace("const sceneRoot='http://127.0.0.1:18764/scenes/'", "const sceneRoot='/scenes/'"))
      }
      if (req.method === 'GET' && /^\/scenes\/[a-z0-9-]+\.webp$/.test(req.url)) {
        const file = new URL('.' + req.url, import.meta.url)
        if (!existsSync(file)) return send(res, 404, {})
        res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=600' })
        return res.end(readFileSync(file))
      }
      if (req.method === 'GET' && /^\/sprites\/[a-z0-9-]+\.(png|webp|svg)$/.test(req.url)) {
        const file = new URL('.' + req.url, import.meta.url)
        if (!existsSync(file)) return send(res, 404, {})
        const ext = req.url.split('.').pop()
        res.writeHead(200, { 'Content-Type': ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/svg+xml', 'Cache-Control': 'private, max-age=300' })
        return res.end(readFileSync(file))
      }
      if (req.method === 'GET' && req.url === '/oakbrook.webp') {
        res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=600' })
        return res.end(readFileSync(mapFile))
      }
      if (req.method === 'GET' && /^\/tv(\?.*)?$/.test(req.url)) return send(res, 200, await tvFeed())
      if (req.method === 'GET' && req.url === '/state') return send(res, 200, status(config).state)
      if (req.method !== 'POST' || req.url !== '/action') return send(res, 404, {})
      if (req.headers.origin !== 'http://' + address || req.headers['content-type'] !== 'application/json') return send(res, 403, {})
      let body = ''
      for await (const part of req) {
        body += part
        if (Buffer.byteLength(body) > 4096) return send(res, 413, {})
      }
      const { kind, id, item, action, jobId, npcId, text, mode, room, x, y, rotation, decorAction, seedId, plotIndex, taskId, autoPilot, video, bvid, title, url, at, minutes, label, treats, note, apptId, specialAction, eventId } = JSON.parse(body)
      const state = status(config).state
  if (kind === 'autopilot') {
    const toggled = setAutoPilot(config, autoPilot === undefined ? undefined : autoPilot === true || autoPilot === '1')
    return send(res, 200, { ...toggled.state, plan: toggled.plan, noticeText: toggled.autoPilot ? '自动出门已打开' : '自动出门已关闭，她会留在原地' })
  }
      if (kind === 'invite') {
    const made = invite(config, { locationId: id, at: at === undefined || at === '' ? 'now' : at, minutes: minutes == null ? 60 : Number(minutes), label: typeof label === 'string' && label.trim() ? label.trim() : '和你约好在这里见面', treats: treats === true || treats === '1', note: typeof note === 'string' ? note : '' })
    return send(res, 200, { ...made.state, plan: made.plan, appointments: made.plan.appointments, noticeText: '日程加了一条：' + made.plan.steps.filter(s => s.apptId === made.appointment.id).map(s => s.time + ' ' + s.label + ' @' + s.locationName).join('') })
  }
  if (kind === 'treat') {
    const made = treat(config, { locationId: id || 'oakbrook-restaurant', at: at, minutes: minutes == null ? 60 : Number(minutes), label: typeof label === 'string' ? label : '', treats: typeof treats === 'boolean' ? treats : true })
    return send(res, 200, { ...made.state, plan: made.plan, appointments: made.plan.appointments, noticeText: '她把今天的安排改成：' + made.chosenTime + ' 在' + made.appointment.locationName + '和你一起吃饭' + (made.appointment.treats ? '（你请客）' : '') })
  }
  if (kind === 'buy-lottery') {
    const bought = buyLottery(config)
    return send(res, 200, { ...bought.state, lottery: bought.lottery, noticeText: '买了一张彩票（号码 ' + bought.ticket.number + '），明天开奖公示' })
  }
  if (kind === 'dine') {
    const ate = dineAt(config, { treats: treats === true || treats === '1' })
    return send(res, 200, { ...ate.state, noticeText: ate.treats ? '和你一起吃了顿饭（你请客，没花钱）' : '在餐厅吃了一顿，花了 ' + ate.cost + ' 镇币' })
  }
  if (kind === 'cancel-appointment') {
    const removed = cancelAppointment(config, apptId || id)
    return send(res, 200, { ...removed.state, plan: removed.plan, appointments: removed.plan.appointments, noticeText: '取消了一条约定' })
  }
    if (kind === 'special-event') {
      const done = resolveSpecialEvent(config, { action: specialAction || action || text })
      return send(res, 200, { ...done.state, noticeText: '记下了：' + done.event.title + '——' + (done.event.action || '') })
    }
  if (kind === 'travel') { const current = status(config).state; if (current.travel?.inProgress) throw Error('她正在前往另一个地点。'); if (current.openHours && current.openHours[id] === false) throw Error('该地点现在已经关门。'); return send(res, 200, travel(config, id, mode === 'transit' ? 'transit' : 'walk').state) }
      if (kind !== 'event-suggestion' && state.location?.id !== id) throw Error('她的位置已变化，请重新进入地点。')
      if (kind === 'buy') return send(res, 200, buy(config, id, item).state)
      if (kind === 'decorate') return send(res, 200, decorate(config, item, { room, x, y, rotation, action: decorAction }).state)
      if (kind === 'work') return send(res, 200, work(config, jobId).state)
      if (kind === 'rest') return send(res, 200, rest(config, mode === 'sleep' ? 'sleep' : 'nap').state)
  if (kind === 'accept-task') { const accepted = acceptTask(config, taskId || item); return send(res, 200, { ...accepted.state, noticeText: accepted.task + ' · ' + accepted.minutes + ' 分钟 · ' + accepted.pay + ' 镇币' }) }
  if (kind === 'reroll-tasks') return send(res, 200, { ...rerollTasks(config).state, noticeText: '换了今天的委托' })
      if (kind === 'eat') return send(res, 200, eat(config, item || id).state)
      if (kind === 'sell') return send(res, 200, sell(config, item || id).state)
      if (kind === 'plant') return send(res, 200, plant(config, seedId || item, plotIndex == null ? null : Number(plotIndex)).state)
      if (kind === 'water') return send(res, 200, waterField(config).state)
      if (kind === 'harvest') return send(res, 200, harvest(config, Number(plotIndex)).state)
      if (kind === 'npc-talk') return send(res, 200, npcTalk(config, npcId, text).state)
      if (kind === 'npc-gift') { const gifted = npcGift(config, npcId, item); return send(res, 200, { ...gifted.state, noticeText: gifted.reaction }) }
      if (kind === 'event-suggestion') return send(res, 200, eventSuggestion(config))
      if (kind === 'watch-tv') {
        const seen = watchTV(config, video || { bvid, title, url })
        return send(res, 200, { ...seen.state, noticeText: '电视开着：' + seen.video.title + ' · 20 分钟' })
      }
      if (kind === 'act' && typeof action === 'string' && action.trim() && action.length <= 200)
        return send(res, 200, act(config, action).state)
      throw Error('无效操作')
    } catch (err) { send(res, 400, { error: err.message }) }
  })
  server.on('error', err => {
    if (err.code !== 'EADDRINUSE') console.error('橡溪镇地图', err.message)
  })
  server.listen(port, host)
  return () => server.close()
}
