# 橡溪镇生活线

一个 14 个地点、11 家商店的小镇，住着一位会按每日路线自己走路、按营业时间出门、深夜回家睡觉的主角。她有一间可以随便布置的小屋，还有一台能看 B 站视频的旧电视。

## 她能做什么

- **自己过日子**：每天 5 点排一条 10 段的路线（起床 / 办事 / 干活 / 午饭 / 闲逛 / 买东西 / 湖边散步 / 回家 / 看书 / 睡觉），到点自己出发，走路有进度条和地图上的小人，走远了会改坐车。
- **按常理生活**：面包房 06:30 开门、五金铺 18:00 打烊，打烊了买不了东西也干不了活；车站末班车之后只能走路；夜里 23:30 之后往家走，在家睡觉按分钟回精力。
- **干活与委托**：9 种活有不同耗时/精力/报酬；每天 3 件委托，5 点换一批，最多换 3 次。
- **小院与田地**：5 种作物按游戏时间生长，下雨自动浇水，能收、能吃、能卖。
- **居民关系**：6 位居民，好感度 6 级，可以聊天、送礼。
- **小屋**：5 间房，35 件家具可以自由摆放、拖动、旋转、收回，带舒适度。
- **商店与电视**：店里的商品摆在展示柜里（3×5 一页，点开看详情）；家具行的旧电视能拉 B 站推荐节目单，选一条就在家看 20 分钟，心情 +6。

## 网页

插件自己起一个只读地图 `http://127.0.0.1:18763/`：室内场景、展示柜、今天的路线、营业时间、居民动态和实时状态。网页不是遥控器——她的生活线在 DSH 对话里推进，网页只是让你看着她。

## 在 DSH 里

- 设置页左侧会出现「橡溪镇」，能改开关、事件模式、显示密度、刷新间隔和默认房间，也能看到此刻的位置、精力、心情和金币。
- 对话时会自动带上她现在的状态（在哪、在做什么、饿不饿、心情如何、路线走到哪一段），所以说话的口气会跟着她的状态变。

## 数据

状态就是一份 JSON，默认 `~/.dsh/town-life.json`，可以整个拷走。

MIT License.

## 约定与请客（1.10.0）

- `town_life_invite({ locationId, at, minutes, label, treats })`：在 `state.appointments` 里加一条当天约定，`at` 支持 `now` / `HH:MM` / `"+30"`；与它重叠的日常段会被去掉，并在段上写 `leaveMin`（提前到几点出发）。
- `pilotTick` 会在 `leaveMin` 到点时让她提前出门；如果 `treats` 为真且她到了餐厅，会自动开始一顿 `kind:'meal'` 的请客饭，不扣钱、心情 +14。
- `town_life_dine({ treats })`：在餐厅坐下吃 30 分钟。`treats=true` 时不扣钱；否则扣 `MEAL_COST = 30` 镇币、心情 +10。
- `town_life_appointments({ apptId, cancel })`：列出今天的约定，传 `apptId` + `cancel:true` 取消并立刻重排日程。
- 网页路线面板把约定段标成 ♥ 并注明「你请客」；`/state` 的 `plan.appointments` 里带 `time` / `untilTime`。

## First run (1.11.3)

- If the save file is missing, `readState` catches `ENOENT`, creates it from the bundled `lib/seed-town.json` (directories included), and continues; the dashboard never starts with a 400.
- `fileOf(config)` falls back to `DEFAULT_FILE`: `DSH_TOWN_LIFE_FILE` → `$DSH_HOME/town-life.json` → `~/.dsh/town-life.json` — no machine-specific path.
- The seed save is a clean "day one": at home, 320 coins, empty bag and rooms, no appointments or tickets.
