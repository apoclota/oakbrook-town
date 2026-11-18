# 自绘图片掉落目录

把 PNG / WEBP / SVG 放在这个目录里，文件名 = 下面的键名，例如 `sofa.png`。
网页会先找 `lib/sprites/<键名>.png`，再找 `.webp`、`.svg`，都没有才用内置的 SVG 模型。

要求：

- 透明背景，物体本身充满画布、正面视角、底部贴齐画布底边。
- 建议像素见下表「建议画布」，同一批图保持一致的绘制风格和比例就好。
- 家具会按百分比坐标摆在房间里，图片里不要再画地面/阴影背景。
- 换图后刷新网页即可看到（浏览器可能缓存 5 分钟，可用 Ctrl+F5 强刷）。

| 键名 | 建议画布（像素） |
| --- | --- |
| `sofa` | 330 × 198 |
| `armchair` | 228 × 228 |
| `table` | 330 × 240 |
| `lowtable` | 288 × 180 |
| `stool` | 144 × 144 |
| `desk` | 330 × 216 |
| `bookshelf` | 228 × 360 |
| `shelf` | 264 × 132 |
| `bed` | 390 × 258 |
| `cabinet` | 288 × 210 |
| `wardrobe` | 252 × 378 |
| `rug` | 360 × 192 |
| `mirror` | 168 × 312 |
| `painting` | 234 × 174 |
| `clock` | 144 × 144 |
| `floor-lamp` | 138 × 312 |
| `lamp` | 126 × 168 |
| `plant` | 144 × 192 |
| `vase` | 108 × 168 |
| `hanging` | 132 × 198 |
| `flowers` | 120 × 168 |
| `candle` | 84 × 120 |
| `curtain` | 234 × 276 |
| `cushion` | 156 × 156 |
| `blanket` | 180 × 144 |
| `bench` | 288 × 168 |
| `rocking-chair` | 216 × 252 |
| `coat-rack` | 138 × 300 |
| `teapot` | 120 × 102 |
| `basket` | 132 × 120 |
| `frame` | 138 × 120 |
| `radio` | 144 × 120 |
| `box` | 120 × 120 |
| `bread` | 132 × 102 |
| `coffee` | 108 × 114 |
| `teacup` | 114 × 102 |
| `soup` | 138 × 114 |
| `dumpling` | 138 × 96 |
| `pie` | 138 × 102 |
| `cake` | 132 × 126 |
| `cookie` | 102 × 102 |
| `book` | 132 × 114 |
| `notebook` | 120 × 126 |
| `postcard` | 138 × 102 |
| `stamp` | 102 × 114 |
| `envelope` | 138 × 96 |
| `ticket` | 132 × 90 |
| `firstaid` | 120 × 108 |
| `bottle` | 84 × 132 |
| `paint` | 108 × 120 |
| `toolbox` | 138 × 108 |
| `raincoat` | 138 × 162 |
| `scarf` | 120 × 138 |
| `seed` | 102 × 120 |
| `soil` | 138 × 90 |
| `crop-seed` | 120 × 96 |
| `crop-sprout` | 126 × 120 |
| `crop-leaf` | 132 × 144 |
| `crop-tomato` | 138 × 144 |
| `crop-pumpkin` | 150 × 132 |
| `crop-wheat` | 120 × 156 |
| `crop-herb` | 126 × 132 |
| `crop-flower` | 132 × 150 |
| `fruit` | 108 × 108 |
| `nightstand` | 210 × 192 |
| `vanity` | 276 × 234 |
| `fireplace` | 312 × 258 |
| `stove` | 264 × 210 |
| `sink` | 234 × 168 |
| `counter` | 312 × 162 |
| `fridge` | 192 × 276 |
| `screen` | 288 × 198 |
| `shoe-cabinet` | 228 × 168 |
| `desk-chair` | 198 × 210 |
| `wall-shelf` | 276 × 120 |
| `rod` | 288 × 66 |
| `wall-lamp` | 138 × 162 |

共 77 个可替换对象。没有列出的新物件会自动使用内置的木箱模型。