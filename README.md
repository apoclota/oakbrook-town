# 橡溪镇生活线 · dsh-town-life

给 DeepSeek Harness（DSH）加一条**会自己过日子的小镇生活线**：一个 14 个地点、11 家商店的小镇，一个会按每天的路线自己走路、按店铺营业时间出门、在深夜回家睡觉的主角，还有一间可以随便布置的小屋。

网页地图是**观察窗口**，你在 DSH 里和她聊天时，她的时间、位置、精力、心情和金币会继续走；设置页里有插件自己的面板。

## 特性

**小镇**
- 14 个地点：小屋、杂货店、餐厅、交通站、公园、彩票店、药房、面包房、五金铺、衣铺、花店、图书馆、木匠工作室、邮局与包裹站、家具行（15 个室内场景，全部带手绘场景图）
- 11 家商店、60+ 件商品：食品、种子、日用品、礼物、35 件家具
- 每间店有自己的营业时间（面包房 06:30 才开门、五金铺 18:00 打烊），打烊了不能买也不能干活；末班车之后车站收班，只能走路

**主角的一天**
- 每天 5 点自动排一条 10 段的路线（起床、出门办事、干活、吃午饭、闲逛、买东西、湖边散步、回家、看书、睡觉）
- 到点自己出发：走路有进度和地图上的小人，走得远会自动改坐车
- 深夜 23:30 之后自动回家睡觉，在家睡觉按分钟回精力
- 饿了、累了、心情低会有语气变化（五档 tone），只影响说话方式，不限制你

**生活细节**
- 时间：1 游戏分钟 = 6 秒现实，`clockOffset` 可以把她拨到一天里的任意时刻
- 精力/心情/饱食度、工作报酬与耗时、吃饭恢复、每日 3 件委托（每天 5 点换一批，最多换 3 次）
- 小院田地：5 种作物按游戏时间生长，下雨自动浇水，可收成、吃、卖
- 6 位居民，好感度 6 级（初识→知己），可以聊天和送礼
- 天气接 Open-Meteo（成都），超时或断网时回落到缓存并标明不是实时

**小屋与展示**
- 5 间房（客厅/卧室/书房/厨房/小院），家具自由摆放、拖动、旋转、收回，带舒适度
- 商店里的商品摆在店内的**展示柜**里，3×5 一页，点开看详情和价格
- 家具行的**旧电视**可以看视频：节目单来自 B 站推荐（`bili` 命令），选一条就能"在电视上看 20 分钟"，回家后心情 +6
- 网页地图 `/`：室内场景、展示柜、路线面板、营业时间、NPC 动态、实时状态

## 安装（DSH 插件）

把整个目录放进 profile 的插件目录，然后在 profile 的 `cordis.patch.yml` 里启用：

```yaml
- insert:
    - id: town-life
      name: 'dsh-town-life'
      config:
        enabled: true
```

或者直接装成 bundle 后用 DSH 的插件管理页开。插件自带 `cordis.patch.yml`：

```yaml
# 橡溪镇主角生活线
- insert:
    - id: town-life
      name: 'dsh-town-life'
      config:
        enabled: true
        eventMode: 'daily'
        allowFreeActions: true
        weatherCity: '成都'
        townScale: 'expanded'
        showNpcDetails: true
        showDecorDetails: true
        mapRefreshSeconds: 2
        defaultDecorRoom: '小书桌与日记本'
```

## 设置

设置页 → 左侧「橡溪镇」：

| 设置 | 说明 |
| --- | --- |
| 启用生活线 | 关闭后她停在原地，不再自己走路 |
| 允许记录自由行动 | 把你说过的行动记进生活线 |
| 显示居民动态 / 装修明细 | 网页上的信息密度 |
| 事件模式 | 每日 / 偶然 / 突发事件 |
| 小镇规模 | 精简 / 扩展 |
| 主角名字 / 头像地址 | 网页上的称呼与头像 |
| 初始小镇币 | 新存档的起始钱 |
| 地图刷新间隔 | 网页轮询秒数 |
| 默认布置房间 | 新家具默认放哪 |

面板还会显示她此刻的位置、在做的事、金币、精力、心情和路线。

## 地图

插件启动后自己监听 `http://127.0.0.1:18763/`（可用环境变量 `TOWN_PORT` 改端口）。

- `/` 实时地图（室内场景 + 展示柜 + 今天的路线）
- `/state` 当前状态 JSON（网页每 `mapRefreshSeconds` 秒拉一次）
- `/tv` 电视节目单（B 站推荐，10 分钟缓存）
- `/scenes/*.webp`、`/sprites/*.png` 手绘场景与物件

## 工具

| 工具 | 作用 |
| --- | --- |
| `town_life_status` | 她此刻在哪、在做什么、精力心情金币、今天的路线 |
| `town_life_enter` | 进入/离开某个地点 |
| `town_life_travel` | 走去另一个地点（走路或坐车，按真实距离计耗时） |
| `town_life_shop` | 在店里买东西（会检查营业时间） |
| `town_life_decorate` | 摆放/移动/旋转/收回家具 |
| `town_life_work` | 在本地点接活干一会 |
| `town_life_rest` / `town_life_eat` | 休息 / 吃东西 |
| `town_life_npc_talk` / `town_life_npc_gift` | 和居民说话 / 送礼 |
| `town_life_event` / `town_life_act` | 推进生活事件 / 记录自由行动 |
| `town_life_tasks` / `town_life_accept_task` | 今天的委托 / 接一件委托 |
| `town_life_plant` / `town_life_water` / `town_life_harvest` / `town_life_sell` | 种、浇、收、卖 |
| `town_life_plan` / `town_life_autopilot` | 看今天的路线 / 开关自动出门 |
| `town_life_weather` | 天气（缓存时标明非实时） |

## 数据

状态存在一个 JSON 文件里，默认 `~/.dsh/town-life.json`（可用 `stateFile` 或环境变量 `DSH_TOWN_LIFE_FILE` 指定）。网页地图和对话共用这一份，存档可以整个拷走。

## 开发者说明

- `index.js`：插件定义、设置 schema、工具、提示词注入
- `client.js`：设置页「橡溪镇」面板（注册 `settings.section`）
- `lib/state.mjs`：全部规则与状态（时间、路线、营业、经济、NPC、田地、装修、电视）
- `lib/dashboard.mjs`：HTTP 地图服务与 `/action`、`/tv`、`/scenes` 路由
- `lib/town.html`：地图前端（室内场景、展示柜、家具拖拽、电视面板）
- `lib/bili.mjs`：B 站节目单（需要本机的 `bili` 命令，失败时回落到本地点播台）
- `lib/sprites/`、`lib/scenes/`：手绘物件与场景

MIT License.
