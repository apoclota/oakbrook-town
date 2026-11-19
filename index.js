import { dashboardUrl, startDashboard } from './lib/dashboard.mjs'
import { npcGift, DEFAULT_FILE, status, event, act, enter, travel, buy, decorate, work, weather, npcTalk, eventSuggestion, rest, eat, sell, plant, waterField, harvest, jobsAt, JOBS, dailyView, rerollTasks, acceptTask, watchTV, invite, dineAt, cancelAppointment, treat, buyLottery, lotteryView } from './lib/state.mjs'
import { loadHostDeps } from './lib/hostdeps.mjs'
import fs from 'node:fs'
import path from 'node:path'

const SETTINGS_FILE = path.join(path.dirname(DEFAULT_FILE), 'town-life.settings.json')
function readSavedSettings() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}
function writeSavedSettings(patch) {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true })
    const merged = { ...readSavedSettings(), ...patch }
    const temp = `${SETTINGS_FILE}.${process.pid}.tmp`
    fs.writeFileSync(temp, JSON.stringify(merged, null, 2) + '\n')
    fs.renameSync(temp, SETTINGS_FILE)
    return true
  } catch (error) { console.error('橡溪镇设置保存失败', error && error.message); return false }
}

const { z } = await loadHostDeps()
const TOWN_OUTPUT = { schema: { type: 'object', additionalProperties: true }, render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] }
const defineTool = spec => ({ ...spec, output: spec.output || TOWN_OUTPUT })

export const inject = ['tools', 'systemPrompt']
let activeConfig = {}
function summary() {
  try {
    const { state } = status(activeConfig)
    return [state.location?.name, state.lastAction?.text || state.currentPhase, '精力 ' + state.energy].filter(Boolean).join(' · ')
  } catch { return '暂时无法读取小镇存档' }
}
function settingsSchema() {
  const overview = z.string().disabled().description('她的近况').extra('volatile', true)
  Object.defineProperty(overview.meta, 'default', { enumerable: true, get: summary })
  Object.defineProperty(overview.meta, 'description', { enumerable: true, get: () => '她的近况 · ' + summary() })
  const currentLocation = z.string().disabled().description('当前位置').extra('volatile', true)
  Object.defineProperty(currentLocation.meta, 'default', { enumerable: true, get: () => { try { return status(activeConfig).state.location?.name || '未进入地点' } catch { return '未进入地点' } } })
  const coinBalance = z.number().disabled().description('当前小镇币').extra('volatile', true)
  Object.defineProperty(coinBalance.meta, 'default', { enumerable: true, get: () => { try { return Number(status(activeConfig).state.wallet?.balance ?? 0) } catch { return 0 } } })
  const npcSummary = z.string().disabled().description('NPC 状态与关系').extra('volatile', true)
  Object.defineProperty(npcSummary.meta, 'default', { enumerable: true, get: () => { try { const s = status(activeConfig).state; return (s.npcs || []).map(n => `${n.name}：${n.activity || '活动中'}，关系 ${s.relationships?.[n.id]?.score || 0}`).join('；') } catch { return '暂时无法读取 NPC' } } })
  const townSummary = z.string().disabled().description('小镇规模与设施').extra('volatile', true)
  Object.defineProperty(townSummary.meta, 'default', { enumerable: true, get: () => { try { const s = status(activeConfig).state; return `${s.locations?.length || 0} 个地点 · ${(s.shops || []).length} 家商店 · ${(s.inventory || []).length} 件物品` } catch { return '暂时无法读取小镇' } } })
  return z.object({
    overview,
    currentLocation,
    coinBalance,
    npcSummary,
    townSummary,
    dashboard: z.string().default(dashboardUrl).link(dashboardUrl).description('打开橡溪镇详细地图；地图会显示她位置、地点、商店和生活操作。').disabled().extra('volatile', true),
    stateFile: z.string().default(DEFAULT_FILE).description('共享生活线 JSON 文件路径；网页地图和她对话读取同一份状态。').extra('volatile', true),
    enabled: z.boolean().default(true).description('启用橡溪镇生活线工具、地图和对话共享状态。').extra('volatile', true),
    eventMode: z.string().default('daily').description('事件模式：daily=每日事件，偶然=同日偶然事件，surprise=突发事件。').extra('volatile', true),
    allowFreeActions: z.boolean().default(true).description('允许记录你或主角选择的自由行动。').extra('volatile', true),
    weatherCity: z.string().default('成都').description('城市级天气位置；当前默认成都，不需要精确住址。').extra('volatile', true),
     homeName: z.string().default('月镜湖·芦苇湾').description('主角当前居住的家名称，可在设置中修改。').extra('volatile', true),
     avatarImageUrl: z.string().default('').description('自定义头像图片地址；留空使用内置头像。').extra('volatile', true),
     townScale: z.string().default('expanded').description('小镇规模：compact=基础六地点，expanded=完整生活设施。').extra('volatile', true),
     showNpcDetails: z.boolean().default(true).description('在地图和状态中显示 NPC 的位置、职业、活动和关系。').extra('volatile', true),
     startingCoins: z.number().min(0).default(320).description('仅在存档没有余额时使用的初始小镇币；之后通过工作和交易变化。').extra('volatile', true),
     mapTheme: z.string().default('oakbrook').description('地图主题：oakbrook=橡溪镇。').extra('volatile', true),
      showDecorDetails: z.boolean().default(true).description('在地图详情中显示家具的房间、坐标和旋转角度。').extra('volatile', true),
      mapRefreshSeconds: z.number().min(1).max(60).default(2).description('地图实时状态刷新间隔，单位为秒。').extra('volatile', true),
      defaultDecorRoom: z.string().default('小书桌与日记本').description('从库存布置家具时使用的默认房间区域。').extra('volatile', true)
  })
}
const SETTINGS_KEYS = ['enabled', 'stateFile', 'eventMode', 'allowFreeActions', 'weatherCity', 'homeName', 'avatarImageUrl', 'townScale', 'showNpcDetails', 'startingCoins', 'mapTheme', 'showDecorDetails', 'mapRefreshSeconds', 'defaultDecorRoom']
const SETTINGS_DEFAULTS = { enabled: true, stateFile: DEFAULT_FILE, eventMode: 'daily', allowFreeActions: true, weatherCity: '成都', homeName: '月镜湖·芦苇湾', avatarImageUrl: '', townScale: 'expanded', showNpcDetails: true, startingCoins: 320, mapTheme: 'oakbrook', showDecorDetails: true, mapRefreshSeconds: 2, defaultDecorRoom: '小书桌与日记本' }
const plainValue = value => (value && typeof value === 'object' && typeof value.get === 'function') ? value.get() : value
const plainConfig = () => {
  const source = plainValue(activeConfig) || {}
  const out = {}
  for (const key of Object.keys(source)) out[key] = plainValue(source[key])
  return out
}
function configView() {
  const current = plainConfig()
  const out = {}
  for (const key of SETTINGS_KEYS) out[key] = current[key] ?? SETTINGS_DEFAULTS[key]
  out.dashboard = dashboardUrl
  return out
}
function townSnapshot() {
  try {
    const s = status(plainConfig()).state
    return { location: s.location?.name || '未进入地点', phase: s.currentPhase || '', coins: Number(s.wallet?.balance ?? s.coins ?? 0), energy: Number(s.energy ?? 0), mood: Number(s.mood ?? 0), locations: (s.locations || []).length, shops: (s.shops || []).length, npcs: (s.npcs || []).length, updatedAt: s.updatedAt || '', clock: s.clock?.local || '', fullness: s.fullness?.label || '', tone: s.tone?.voice || '', activity: s.activity ? (s.activity.label + ' · 还剩 ' + s.activity.remainMinutes + ' 分钟') : '', field: s.field ? (s.field.planted + ' / ' + s.field.plots.length + ' 块地有作物') : '' }
  } catch (error) { return { error: error.message } }
}

function townPromptLine() {
  if (plainConfig().enabled === false) return ''
  const s = status(plainConfig()).state
  const tone = s.tone || {}
  const parts = []
  parts.push('【橡溪镇】' + (s.clock?.label || '') + ' ' + (s.clock?.local || '') + '，她在' + (s.location?.name || '镇上') + '。')
  const hereId = s.location?.id
  const hv = hereId && s.hours ? s.hours[hereId] : null
  if (hv && hv.isOpen === false) parts.push('这里已经打烊了（营业 ' + hv.openText + '–' + hv.closeText + '）。')
  if (s.night) parts.push('夜深了，街上没什么人，她应该回家睡觉。')
  parts.push('精力 ' + Math.round(Number(s.energy ?? 0)) + '/100（' + (tone.energyLabel || '正常') + '），心情 ' + Math.round(Number(s.mood ?? 0)) + '，' + (s.fullness?.label ? '饱食感：' + s.fullness.label + '。' : ''))
  if (s.travel && s.travel.inProgress) {
    const from = (s.locations || []).find(x => x.id === s.travel.inProgress.from)
    const to = (s.locations || []).find(x => x.id === s.travel.inProgress.to)
    parts.push('她正走在路上：' + (from ? from.name : s.travel.inProgress.from) + ' → ' + (to ? to.name : s.travel.inProgress.to) + '，大约再 ' + Math.max(1, Math.round((Date.parse(s.travel.inProgress.eta) - Date.now()) / 60000)) + ' 分钟到。')
  } else if (s.plan && s.plan.current) {
    parts.push('这是她自己排的今天的行程，现在该在' + s.plan.current.locationName + '（' + s.plan.current.label + '）' + (s.plan.next ? '，下一站 ' + s.plan.next.time + ' 去' + s.plan.next.locationName + '。' : '。'))
  }
  if (s.lottery) {
    if (s.lottery.pending) parts.push('她今天买了 ' + s.lottery.pending + ' 张彩票，明天才知道中没中。')
    if (s.lottery.lastResult) parts.push('彩票公示：' + s.lottery.lastResult.number + ' ' + (s.lottery.lastResult.amount ? '中了' + s.lottery.lastResult.prizeLabel + '（' + s.lottery.lastResult.amount + ' 镇币）' : '没中，谢谢参与') + '。')
  }
  const appts = (s.plan && Array.isArray(s.plan.appointments) ? s.plan.appointments : []).filter(a => a && a.label)
  if (appts.length === 1) {
    const a = appts[0]
    parts.push('今天和你约了 ' + a.time + ' 在' + a.locationName + '（' + a.label + (a.treats ? '，你请客' : '') + '）。')
  } else if (appts.length > 1) {
    parts.push('今天和你约了 ' + appts.map(a => a.time + ' ' + a.locationName + (a.treats ? '（你请客）' : '')).join('、') + '。')
  }
  if (!s.activity && s.planStep && String(s.planStep).startsWith('a-') && s.plan && Array.isArray(s.plan.steps)) {
    const step = s.plan.steps.find(x => x && x.id === s.planStep)
    if (step && step.appointment) parts.push('她提前到了' + step.locationName + '，正在等你' + step.time + ' 的约定。')
  }
  if (!s.activity && s.planStep && String(s.planStep).startsWith('a-') && s.plan && Array.isArray(s.plan.steps)) {
    const step = s.plan.steps.find(x => x && x.id === s.planStep)
    if (step && step.appointment) parts.push('她提前到了' + step.locationName + '，正在等你' + step.time + ' 的约定。')
  }
  if (s.activity) parts.push('她正在' + s.activity.label + '，还剩 ' + s.activity.remainMinutes + ' 分钟（这段时间也可以聊天，只是手上忙着）。')
  if (s.daily && Array.isArray(s.daily.tasks)) {
    const left = s.daily.tasks.filter(t => !t.done).length
    if (left) parts.push('今天还有 ' + left + ' 件委托可以去接。')
    else if (s.daily.tasks.length) parts.push('今天的委托都做完了。')
  }
  const field = s.field
  if (field && field.planted) {
    const ready = field.plots.filter(p => p.ready).length
    parts.push('小院 ' + field.planted + ' 块地有作物' + (ready ? '，其中 ' + ready + ' 块已经能收' : '') + '。')
  }
  parts.push('说话口气按这个来：' + (tone.voice || '正常') + '。' + (tone.hint || ''))
  if (s.fullness?.hint) parts.push(s.fullness.hint)
  return parts.join('')
}
function registerPrompt(ctx) {
  try {
    const sp = ctx.systemPrompt || (typeof ctx.get === 'function' ? ctx.get('systemPrompt') : null)
    if (!sp || typeof sp.context !== 'function') return () => {}
    const off = sp.context({ name: 'town-life-state', order: 930, text: () => { try { return townPromptLine() } catch (error) { return '' } } })
    if (typeof off === 'function') return off
    return () => off?.off?.()
  } catch (error) { console.error('橡溪镇语气提示注入失败（不影响插件本身）', error && error.message); return () => {} }
}
function registerSettingsRoutes(ctx) {
  const readBody = req => new Promise(resolve => { let body = ''; req.on('data', chunk => { body += chunk; if (body.length > 65536) body = body.slice(0, 65536) }); req.on('end', () => { try { resolve(JSON.parse(body || '{}')) } catch { resolve({}) } }); req.on('error', () => resolve({})) })
  const sendJson = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
  const authorized = async (req, res, handler) => {
    try { const connection = ctx.get?.('connection'); const rejected = connection?.requestRejection?.(req); if (rejected === 401 || rejected === 403) return sendJson(res, rejected, { ok: false, error: rejected === 401 ? 'authentication_required' : 'management_forbidden' }) } catch {}
    return handler(req, res)
  }
  const handler = (req, res) => authorized(req, res, async () => {
    if (req.method === 'POST') {
      const patch = await readBody(req)
      const next = {}
      for (const key of SETTINGS_KEYS) if (Object.prototype.hasOwnProperty.call(patch, key)) next[key] = patch[key]
      try {
        writeSavedSettings(next)
        activeConfig = { ...activeConfig, ...next }
        try {
          const entry = ctx.fiber?.entry
          const editor = ctx.get?.('configEditor')
          if (entry && editor) await editor.edit(entry, current => ({ ...(current || {}), ...next }))
        } catch (error) { if (!/root Include entry/.test(String(error && error.message))) console.error('橡溪镇配置写入 profile 失败', error && error.message) }
        return sendJson(res, 200, { ok: true, config: configView(), state: townSnapshot() })
      } catch (error) { return sendJson(res, 400, { ok: false, error: error.message }) }
    }
    return sendJson(res, 200, { ok: true, config: configView(), state: townSnapshot() })
  })
  const registerRoutes = webCtx => webCtx.effect(() => webCtx.webServer.register({ kind: 'exact', path: '/town-life/settings', handler }))
  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], registerRoutes)
  else if (ctx.webServer?.register) registerRoutes(ctx)
}
export const Config = z ? settingsSchema() : undefined
export function apply(ctx, config = {}) {
  activeConfig = { ...(config || {}), ...readSavedSettings() }
  if (config.enabled === false) return () => {}
  let stopDashboard = () => {}
  try { stopDashboard = startDashboard(config) } catch (error) { console.error('橡溪镇地图启动失败（不影响插件本身）', error && error.message) }
  const off = [stopDashboard]
  const reg = (spec, execute) => off.push(ctx.tools.register(defineTool({ ...spec, execute })))
  reg({ name: 'town_life_status', description: '读取橡溪镇主角的当前状态：地点、精力、心情、饱食度、镇币、正在做的事、能干的活和小院田地；返回里的 tone.hint 说明她此刻说话该是什么口气（精力越低越短、越疲），请照此调整语气。只读。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => status(config))
  reg({ name: 'town_life_event', description: '推进一次生活线事件；daily 按当天选择每日或偶然事件，surprise 选择突发事件。', parameters: { type: 'object', properties: { kind: { type: 'string', enum: ['daily', 'surprise'], default: 'daily' } }, additionalProperties: false } }, async ({ kind = 'daily' }) => event(config, kind === 'surprise' ? 'surprise' : 'tick'))
  reg({ name: 'town_life_act', description: '记录你或主角选择的自由行动，并结束当前事件。', parameters: { type: 'object', required: ['action'], properties: { action: { type: 'string', minLength: 1, maxLength: 200 } }, additionalProperties: false } }, async ({ action }) => act(config, action))
  reg({ name: 'town_life_enter', description: '进入或入住小镇地点；进入水边小屋后可布置、休息和工作。', parameters: { type: 'object', required: ['locationId'], properties: { locationId: { type: 'string' } }, additionalProperties: false } }, async ({ locationId }) => enter(config, locationId))
  reg({ name: 'town_life_travel', description: '在小镇地点之间移动；walk 按步行耗时、transit 按交通耗时推进，路上会消耗精力。', parameters: { type: 'object', required: ['locationId'], properties: { locationId: { type: 'string' }, mode: { type: 'string', enum: ['walk', 'transit'], default: 'walk' } }, additionalProperties: false } }, async ({ locationId, mode = 'walk' }) => travel(config, locationId, mode))
  reg({ name: 'town_life_shop', description: '在现实对应的小镇商店购买物品，自动扣除小镇币并写入库存。', parameters: { type: 'object', required: ['shopId', 'itemId'], properties: { shopId: { type: 'string' }, itemId: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 10, default: 1 } }, additionalProperties: false } }, async ({ shopId, itemId, quantity = 1 }) => buy(config, shopId, itemId, quantity))
  reg({ name: 'town_life_decorate', description: '把已购买物品布置进月镜湖芦苇湾水边小屋并持久化房屋状态。', parameters: { type: 'object', required: ['itemId'], properties: { itemId: { type: 'string' } }, additionalProperties: false } }, async ({ itemId }) => decorate(config, itemId))
  reg({ name: 'town_life_jobs', description: '列出当前地点能干的活：报酬、耗时（游戏分钟）、要花的精力，以及现在为什么不能干。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => { const snapshot = status(config); return { ok: true, mode: 'jobs', location: snapshot.state.location, jobs: snapshot.state.jobs, tone: snapshot.state.tone } })
  reg({ name: 'town_life_work', description: '在当前地点接一份活开始干：会占用一段游戏时间（10–25 分钟），结束时结算镇币、扣精力；干活期间仍可以聊天，只是她手上忙着。精力不够会直接拒绝。', parameters: { type: 'object', properties: { jobId: { type: 'string' } }, additionalProperties: false } }, async ({ jobId }) => work(config, jobId))
  reg({ name: 'town_life_rest', description: '休息：mode=nap 在小屋或长椅上歇一会儿（按舒适度回精力，占一段时间）；mode=sleep 睡到第二天早上，精力回满。', parameters: { type: 'object', properties: { mode: { type: 'string', enum: ['nap', 'sleep'], default: 'nap' } }, additionalProperties: false } }, async ({ mode = 'nap' }) => rest(config, mode))
  reg({ name: 'town_life_eat', description: '吃掉背包里的一样食物：恢复精力、抬高心情、消掉饥饿提示，并推进一点游戏时间。', parameters: { type: 'object', required: ['itemId'], properties: { itemId: { type: 'string' } }, additionalProperties: false } }, async ({ itemId }) => eat(config, itemId))
  reg({ name: 'town_life_sell', description: '把背包里的一件东西卖回商店：普通物品半价，家具六折。', parameters: { type: 'object', required: ['itemId'], properties: { itemId: { type: 'string' } }, additionalProperties: false } }, async ({ itemId }) => sell(config, itemId))
  reg({ name: 'town_life_plant', description: '在小屋小院里种下一包种子（种子在花店、杂货店、药房买）。生长按游戏时间，浇水会加快。', parameters: { type: 'object', required: ['seedId'], properties: { seedId: { type: 'string' }, plotIndex: { type: 'integer', minimum: 0, maximum: 2 } }, additionalProperties: false } }, async ({ seedId, plotIndex }) => plant(config, seedId, plotIndex))
  reg({ name: 'town_life_water', description: '给小院的作物浇水（一次浇全部，耗 3 点精力、3 分钟）。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => waterField(config))
  reg({ name: 'town_life_harvest', description: '收一块成熟的田：作物进背包，可以卖钱、吃或送人。', parameters: { type: 'object', required: ['plotIndex'], properties: { plotIndex: { type: 'integer', minimum: 0, maximum: 2 } }, additionalProperties: false } }, async ({ plotIndex }) => harvest(config, plotIndex))
  reg({ name: 'town_life_tasks', description: '看今天的委托：每天自动换一批（3 件），列出委托人、地点、报酬、耗时和精力，以及现在为什么接不了。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => { const snapshot = status(config); return { ok: true, mode: 'tasks', location: snapshot.state.location, daily: snapshot.state.daily } })
  reg({ name: 'town_life_accept_task', description: '接下来的委托：要人在委托地点、精力够、手上没有别的活；做完自动结算镇币、好感和小礼物。', parameters: { type: 'object', required: ['taskId'], properties: { taskId: { type: 'string' } }, additionalProperties: false } }, async ({ taskId }) => acceptTask(config, taskId))
  reg({ name: 'town_life_reroll_tasks', description: '换一批今天的委托（每天最多换 3 次，次日自动刷新）。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => rerollTasks(config))
  reg({ name: 'town_life_npc_talk', description: '与当前小镇 NPC 互动并记录关系变化。', parameters: { type: 'object', required: ['npcId'], properties: { npcId: { type: 'string' }, text: { type: 'string', maxLength: 200 } }, additionalProperties: false } }, async ({ npcId, text = '' }) => npcTalk(config, npcId, text))
  reg({ name: 'town_life_npc_gift', description: '把背包里的一件东西送给小镇居民，按喜好提升好感度并返回对方反应。', parameters: { type: 'object', required: ['npcId', 'itemId'], properties: { npcId: { type: 'string' }, itemId: { type: 'string' } }, additionalProperties: false } }, async ({ npcId, itemId }) => npcGift(config, npcId, itemId))
  reg({ name: 'town_life_event_suggestion', description: '根据现实时间、天气和地点给出一条正在流动的生活事件建议。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => eventSuggestion(config))
  reg({ name: 'town_life_weather', description: '读取成都城市级天气状态；未接入真实天气服务时会明确标注占位。', parameters: { type: 'object', properties: {}, additionalProperties: false } }, async () => weather(config))
  reg({ name: 'town_life_watch_tv', description: '在小屋看电视：旧电视开着，选一条节目看 20 分钟（心情 +6）。可以传 title 指定节目，不传就随意看一集。', parameters: { type: 'object', properties: { title: { type: 'string' }, bvid: { type: 'string' }, url: { type: 'string' } }, additionalProperties: false } }, async (args = {}) => { const t = watchTV(config, { title: args.title, bvid: args.bvid, url: args.url }); return { ok: t.ok, minutes: t.minutes, mood: t.state.mood, activity: t.state.activity && t.state.activity.label } })
reg({ name: 'town_life_invite', description: '和她在指定地点约一件事，会临时改掉她今天日程里与这个时段重叠的安排（她会提前出发）。at 写 now、HH:MM 或 "+30"（多少分钟后），treats 为 true 表示这顿你请客、她不花钱。', parameters: { type: 'object', required: ['locationId'], properties: { locationId: { type: 'string' }, at: { type: 'string', description: 'now / HH:MM / +30' }, minutes: { type: 'integer', minimum: 10, maximum: 240, default: 60 }, label: { type: 'string', maxLength: 60 }, treats: { type: 'boolean', default: false }, note: { type: 'string', maxLength: 120 } }, additionalProperties: false } }, async ({ locationId, at = 'now', minutes = 60, label = '', treats = false, note = '' }) => invite(config, { locationId, at, minutes, label, treats, note }))
reg({ name: 'town_life_dine', description: '和她在橡溪餐厅吃一顿，占 30 分钟：treats=true 你请客不花钱（心情 +14），否则扣 30 镇币（心情 +10）。要人在餐厅、店开着、手上没别的活。', parameters: { type: 'object', properties: { treats: { type: 'boolean', default: false } }, additionalProperties: false } }, async ({ treats = false } = {}) => dineAt(config, { treats }))
reg({ name: 'town_life_appointments', description: '查看今天的约定（时间、地点、是不是你请客）；传 apptId 或 locationId 可以取消一条约定，日程会立刻重排。只读除非给了要取消的 id。', parameters: { type: 'object', properties: { apptId: { type: 'string' }, cancel: { type: 'boolean', default: false } }, additionalProperties: false } }, async ({ apptId, cancel = false } = {}) => { if (cancel && apptId) { const off = cancelAppointment(config, apptId); return { ok: true, mode: 'cancel-appointment', plan: off.plan } } const snapshot = status(config); return { ok: true, mode: 'appointments', appointments: snapshot.state.plan && snapshot.state.plan.appointments, plan: snapshot.state.plan } })
reg({ name: 'town_life_treat', description: '简单触发她请你吃饭：说一句「今天请你吃饭」就来这个。不用给时间，她自己挑（午饭 12:10 或晚饭 18:30，太晚就挑一个当下能赶上的时间），自动写进今天的日程并标记你请客（她不花钱）。', parameters: { type: 'object', properties: { locationId: { type: 'string', default: 'oakbrook-restaurant' }, at: { type: 'string', description: '想指定时间就写 HH:MM，不填她自己挑' }, minutes: { type: 'integer', minimum: 10, maximum: 240, default: 60 }, label: { type: 'string', maxLength: 60 }, treats: { type: 'boolean', default: true } }, additionalProperties: false } }, async ({ locationId = 'oakbrook-restaurant', at, minutes = 60, label = '', treats = true } = {}) => treat(config, { locationId, at, minutes, label, treats }))
reg({ name: 'town_life_lottery', description: '彩票：buy=true 在幸运星彩票店买一张（10 镇币，第二天开奖公示）；不传 buy 就查看今天买了什么票、昨天的公示结果和奖项表。一等奖大奖 500、二等奖三倍 30、三等奖回本 10。', parameters: { type: 'object', properties: { buy: { type: 'boolean', default: false } }, additionalProperties: false } }, async ({ buy = false } = {}) => { if (buy) { const b = buyLottery(config); return { ok: true, mode: 'buy-lottery', ticket: b.ticket, balance: b.balance, lottery: b.lottery } } const s = status(config).state; return { ok: true, mode: 'lottery', lottery: s.lottery } })
  try { off.push(registerPrompt(ctx)) } catch (error) { console.error('橡溪镇语气提示注入失败（不影响插件本身）', error && error.message) }
  try { registerSettingsRoutes(ctx) } catch (error) { console.error('橡溪镇设置接口注册失败（不影响插件本身）', error && error.message) }
  return () => off.forEach(fn => { try { fn?.() } catch {} })
}
