# 丝绸之路互动地图 · 一期 MVP 执行版规格

版本：v1.1 · 日期：2026-06-16  
定位：可直接进入开发排期的执行文档  
实施基线：`Next.js 16` + `React 19` + `App Router` + `Tailwind CSS 4` + `MapLibre GL JS` + `Zustand` + `Supabase` + `Next DevTools MCP`

---

## 0. 本版相对 v1.0 的关键调整

本版不是推翻重写，而是在 `v1.0` 基础上做面向开发执行的补强，核心调整如下：

1. **部署策略调整**
   - 前端部署到 `Vercel`
   - `Cloudflare` 仅负责 DNS、HTTPS、域名转发 / 代理
   - 不再把一期部署强绑定到 `Cloudflare Pages`

2. **数据结构补强**
   - `places` 新增 `related_place_ids`
   - `source_id` 调整为 `source_ids`
   - 详情面板、来源展示与数据结构对齐

3. **接口返回补强**
   - `/api/map-data` 直接返回 `sources`
   - 一期前端允许优先读取本地 JSON，后续再切 API

4. **交互规则收敛**
   - 非当前时期节点统一为“半透明、不可点击、不响应 hover”，而不是彻底隐藏
   - 路线在 3 个时期都保留显示，只切换主色与透明度，不改变几何数据

5. **开发顺序优化**
   - 阶段 A 先用本地静态数据打通主流程
   - 阶段 B 再接 Supabase 和 API
   - 避免一开始就卡在部署和后端集成

6. **工程基线统一到 Next.js 16**
   - 与当前项目版本、官方 MCP、Vercel 部署链路保持一致
   - 默认接受 Turbopack 与异步 Request APIs 的新约束
   - 不再按 Next.js 14 / 15 的迁移兼容思路设计一期实现

---

## 一、MVP 边界

### 1.1 做什么

一期只做一个可上线演示、可给人看、可继续迭代的丝绸之路互动地图，包含：

- 一张丝绸之路互动地图
- 25 个核心历史节点
- 2 条主路线（陆路主线 + 海上丝路）
- 点击节点打开右侧详情面板
- 顶部时期切换栏（汉、唐、宋元）
- 搜索节点
- 来源说明页
- 关于页

### 1.2 不做什么

以下内容明确排除出一期范围：

- AI 问答
- AI 导览
- 用户登录 / 收藏
- 后台 CMS
- 多专题地图
- 深度移动端适配
- 复杂疆域边界面数据
- 路线动态演化动画
- 节点关系图谱

### 1.3 一期目标定义

一期不是做“历史研究平台”，而是做一个：

> **以可视化展示为核心、具备基础史料说明能力的互动地图 Demo。**

判断标准不是“内容绝对完备”，而是：

- 主流程顺畅
- 地图可看
- 节点可点
- 时期可切
- 搜索可用
- 来源可解释
- 链接可分享

---

## 二、技术栈与部署策略

### 2.1 技术栈

| 层级 | 选型 | 说明 |
|------|------|------|
| 前端框架 | Next.js 16（App Router） | 主站、页面路由、SEO、API 一体化，并与当前工程版本一致 |
| React | React 19 | 与 Next.js 16 配套，兼容最新 App Router 能力 |
| 地图库 | MapLibre GL JS 4.x | 可控性高，适合历史地图场景 |
| 状态管理 | Zustand | 管理选中节点、时期、搜索、面板状态 |
| 样式 | Tailwind CSS 4 | 与当前项目初始化配置保持一致 |
| 数据库 | Supabase Postgres | 一期免费起步即可 |
| 存储 | Supabase Storage | 存放图片等静态资源 |
| API 层 | Next.js Route Handlers | 一期足够，后续也易扩展 |
| Agent 协作 | Next DevTools MCP | 用于开发期错误、路由、元数据与运行时诊断 |
| 部署 | Vercel | 优先保证 Next.js 集成与上线效率 |
| 域名 / DNS | Cloudflare | 只负责 DNS、HTTPS、转发与代理 |

### 2.2 部署原则

一期优先遵守以下原则：

1. **先把前端体验跑通，再接数据库**
2. **先保证 Vercel 一键可部署，再谈多环境和复杂边缘运行时**
3. **Cloudflare 只做域名层，不承载一期应用运行时**

### 2.3 部署架构

```text
用户浏览器
   ↓
Cloudflare（DNS / HTTPS / 代理）
   ↓
Vercel（Next.js 前端 + Route Handlers）
   ↓
Supabase（Postgres + Storage）
```

### 2.4 关于 API 运行时

一期默认策略：

- 前端页面运行在 Next.js App Router
- Route Handlers 优先使用默认兼容方案
- **只有在确认依赖兼容且确有必要时**，再单独声明 `runtime = 'edge'`

说明：

- 在 `Vercel` 上，一期不需要为了部署而强行适配 `Cloudflare Pages`
- 这样可以减少 Edge Runtime 兼容性问题和调试成本

### 2.5 Next.js 16 实施约束

一期按以下约束实现：

- `params`、`searchParams`、动态 Route Handler 的 `segmentData.params` 一律按异步访问处理
- Next.js 16 默认使用 Turbopack；一期不引入额外 Webpack 定制
- 项目根目录可配置 `.mcp.json`，启用 `next-devtools-mcp`
- 优先使用环境变量，不依赖已移除的 Runtime Config 方案

---

## 三、信息架构与页面结构

### 3.1 页面路由

```text
/                    首页（重定向到 /map/silk-road）
/map/silk-road       地图主页面（核心页）
/about               关于项目
/sources             数据来源与说明
```

### 3.2 页面职责

#### `/map/silk-road`
承担全部核心交互：

- 地图展示
- 节点渲染
- 路线渲染
- 时期切换
- 搜索定位
- 节点详情面板

#### `/about`
用于解释：

- 项目目标
- 一期边界
- 为什么做这个地图
- 后续会如何扩展

#### `/sources`
用于解释：

- 数据来源列表
- 坐标与路线的精度说明
- `confirmed / approximate / disputed` 的含义
- 一期数据限制

---

## 四、数据规格

---

### 4.1 TypeScript 领域类型约定

```ts
type PeriodId = 'han' | 'tang' | 'song-yuan'
type PlaceType = 'city' | 'pass' | 'port' | 'oasis'
type Importance = 'high' | 'normal'
type Certainty = 'confirmed' | 'approximate' | 'disputed'
```

说明：前端、种子数据、API 返回、数据库字段语义都以此为准。

---

### 4.2 节点数据（25 个）

**数据来源优先级**
1. Pleiades（古代地名坐标优先）
2. 权威历史地图 / 学术资料
3. Claude 生成初稿 + Google Maps 人工校验
4. Wikipedia infobox 作为补充参考

**节点字段结构（执行版）**

```json
{
  "id": "dunhuang",
  "name": "敦煌",
  "aliases": ["沙州", "Dunhuang"],
  "type": "city",
  "lat": 40.142,
  "lng": 94.662,
  "periods": ["han", "tang", "song-yuan"],
  "importance": "high",
  "certainty": "confirmed",
  "description": "河西走廊西端重镇，丝路分岔口，莫高窟所在地。",
  "highlights": ["莫高窟", "玉门关", "阳关"],
  "source_ids": ["src_001", "src_003"],
  "related_place_ids": ["yumenguan", "loulan"],
  "period_notes": {
    "han": "汉武帝设敦煌郡，西域都护府前哨。",
    "tang": "唐代贸易最繁盛时期，人口超10万。"
  }
}
```

### 4.3 节点字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | text | 是 | 稳定唯一标识，用于路由、状态、引用 |
| name | text | 是 | 主名称 |
| aliases | text[] | 否 | 别名、中英文名称 |
| type | PlaceType | 是 | 节点类型 |
| lat / lng | number | 是 | 坐标 |
| periods | PeriodId[] | 是 | 该节点出现或活跃的时期 |
| importance | Importance | 是 | 控制默认视觉权重 |
| certainty | Certainty | 是 | 坐标或历史归属的确定性 |
| description | text | 是 | 简介 |
| highlights | text[] | 否 | 补充信息关键词 |
| source_ids | text[] | 是 | 对应来源 ID，可多个 |
| related_place_ids | text[] | 否 | 详情面板展示的相关节点 |
| period_notes | object | 否 | 不同时期说明 |

### 4.4 节点类型分类

| type | 含义 | 图标样式 |
|------|------|----------|
| city | 重要城市 / 都城 | 大圆点 |
| pass | 关隘 / 要道 | 菱形 |
| port | 港口 | 锚形 |
| oasis | 绿洲驿站 | 小圆点 |

### 4.5 25 个节点清单

**陆路 18 个**

- 长安
- 洛阳
- 凉州
- 敦煌
- 玉门关
- 楼兰
- 于阗
- 疏勒（喀什）
- 大宛（费尔干纳）
- 撒马尔罕
- 木鹿（梅尔夫）
- 波斯波利斯
- 泰西封
- 安条克
- 亚历山大港
- 康居
- 大月氏故地
- 蓝氏城

**海路 7 个**

- 广州
- 泉州
- 占城（越南）
- 马六甲
- 锡兰（斯里兰卡）
- 科泽科德（印度）
- 亚丁

---

### 4.6 路线数据（2 条）

```json
{
  "id": "silk-road-land-main",
  "name": "陆上丝绸之路（主线）",
  "type": "main",
  "certainty": "approximate",
  "periods": ["han", "tang", "song-yuan"],
  "color": "#C4963C",
  "geojson": {
    "type": "LineString",
    "coordinates": [
      [108.9, 34.3],
      [103.8, 36.0],
      [102.8, 36.5],
      [94.7, 40.1],
      [80.3, 39.5],
      [71.4, 39.4],
      [63.6, 39.7],
      [58.4, 37.9],
      [50.0, 32.7],
      [36.3, 33.3],
      [29.9, 31.2]
    ]
  },
  "source_ids": ["src_002"]
}
```

### 4.7 路线规则

一期对路线采用最小策略：

- 只维护 2 条主路线
- 三个时期都保留显示
- 切换时期时：
  - 路线颜色跟随当前时期主色
  - 非重点路线可降低透明度
- **一期不做** 各时期路线几何形状差异
- **一期不做** 线路动画播放

---

### 4.8 时期定义

```json
[
  { "id": "han",       "label": "汉代",   "range": [-206, 220],  "color": "#8B4513" },
  { "id": "tang",      "label": "唐代",   "range": [618, 907],   "color": "#C4963C" },
  { "id": "song-yuan", "label": "宋元",   "range": [960, 1368],  "color": "#2E6B5E" }
]
```

默认选中：`tang`

原因：

- 节点完整度高
- 用户认知最强
- 视觉展示效果通常最好

---

### 4.9 来源数据

```json
[
  { "id": "src_001", "title": "Pleiades 古代地名数据库", "url": "https://pleiades.stoa.org", "note": "坐标来源" },
  { "id": "src_002", "title": "《中国历史地图集》谭其骧主编", "year": 1982, "note": "路线走向参考" },
  { "id": "src_003", "title": "UNESCO 丝绸之路在线平台", "url": "https://en.unesco.org/silkroad", "note": "综合参考" }
]
```

---

## 五、交互与视觉规则

### 5.1 地图主页面布局

```text
┌─────────────────────────────────────────────────────┐
│  Logo · 丝绸之路互动地图          搜索框   来源说明  │  ← 顶部导航栏 56px
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              地图区域（MapLibre）                    │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  汉代 ●────────────── 唐代 ──────────────── 宋元    │  ← 时间轴 64px
└─────────────────────────────────────────────────────┘
```

点击节点后，右侧滑出详情面板（宽 360px）。

---

### 5.2 底图样式要求

一期目标是“简洁、现代元素弱化、接近历史展示感”，但不追求重度定制。

**优先级 A：先可用**
- 选择干净、可读的底图样式
- 先跑通地图、点、线、面板

**优先级 B：再优化**
- 背景色：米黄 `#F5F0E8`
- 海洋色：浅蓝 `#C8DDE8`
- 尽量隐藏现代高速、商业 POI、地铁线
- 保留山脉轮廓、主要河流、海岸线、低透明度国界

说明：若底图样式源限制较多，一期以“信息表达正确”优先，不为风格化卡住开发。

---

### 5.3 节点状态规则

| 状态 | 视觉 | 行为 |
|------|------|------|
| 默认 | 彩色点，按 importance 控制大小 | 可点击 |
| 非当前时期 | 透明度 0.2 | 不可点击，不响应 hover |
| Hover | 放大 1.2x + 白色描边 + tooltip | 仅当前时期节点响应 |
| Selected | 放大 1.4x + 橙色描边 | 打开详情面板 |

**统一规则：**
- 非当前时期节点不彻底隐藏
- 统一半透明保留在地图上
- 这样可保留空间感和历史纵深感

---

### 5.4 时间轴交互

- 固定三个时期节点：汉 / 唐 / 宋元
- 点击切换，不做拖动时间轴
- 切换后：
  - 当前时期节点正常显示
  - 其他时期节点半透明
  - 路线颜色切换为当前时期主色
- 默认选中：唐代

---

### 5.5 搜索规则

一期搜索为**本地数据过滤**，不依赖接口。

**匹配字段**
- `name`
- `aliases`

**匹配优先级**
1. `name === query`
2. `aliases` 精确匹配
3. `name startsWith query`
4. `aliases startsWith query`

**交互规则**
- 忽略大小写
- 自动去除首尾空格
- 空查询不显示下拉
- 最多展示 8 条结果
- 点击结果后：
  - 地图 `flyTo`
  - 选中节点
  - 打开详情面板
- 无结果时显示“未找到相关节点”

---

### 5.6 详情面板内容

详情面板展示以下内容：

- 节点名称
- 别名
- 类型标签
- 所属时期
- 简介
- 各时期说明（折叠）
- 相关节点
- 来源标注
- certainty 提示（如 approximate / disputed）

### 5.7 详情面板的降级规则

若部分字段缺失，则采用如下策略：

- `aliases` 为空：不显示别名行
- `period_notes` 某时期缺失：显示“暂无该时期说明”
- `related_place_ids` 为空：隐藏“相关节点”模块
- `source_ids` 为空：显示“来源待补充”

---

## 六、数据库表结构（Supabase）

一期只建 4 张表，保持最小可维护规模。

```sql
-- 节点
create table places (
  id                text primary key,
  name              text not null,
  aliases           text[],
  type              text not null,
  lat               float8 not null,
  lng               float8 not null,
  periods           text[] not null,
  importance        text default 'normal',
  certainty         text default 'confirmed',
  description       text,
  highlights        text[],
  period_notes      jsonb,
  source_ids        text[] not null default '{}',
  related_place_ids text[] default '{}'
);

-- 路线
create table routes (
  id          text primary key,
  name        text,
  type        text,
  certainty   text,
  periods     text[],
  color       text,
  geojson     jsonb,
  source_ids  text[] not null default '{}'
);

-- 时期
create table periods (
  id          text primary key,
  label       text,
  start_year  int,
  end_year    int,
  color       text
);

-- 来源
create table sources (
  id          text primary key,
  title       text,
  author      text,
  year        int,
  url         text,
  note        text
);
```

### 6.1 设计说明

一期不做：

- 复杂关联表
- 多语言表
- 媒体资源关联表
- 审核 / 发布状态
- CMS 结构

原因：

- 节点数量少
- 内容固定
- 手工维护成本可接受
- 先把产品体验跑通更重要

---

## 七、API 设计（Next.js Route Handlers）

### 7.1 一期接口清单

```text
GET  /api/map-data          返回地图页所需全量数据
GET  /api/search?q=关键词   搜索节点（一期前端可不依赖）
GET  /api/places/:id        单个节点详情
GET  /api/sources           来源列表
```

### 7.2 `/api/map-data` 返回结构（执行版）

```json
{
  "places": [],
  "routes": [],
  "periods": [],
  "sources": [],
  "meta": {
    "topic": "silk-road",
    "title": "丝绸之路互动地图",
    "updatedAt": "2026-06-16"
  }
}
```

### 7.3 一期数据获取策略

按阶段分两种：

#### 阶段 A
- 直接从本地 `data/seed/silk-road-seed.json` 读取
- 不依赖数据库
- 不依赖 API

#### 阶段 B
- 接入 Supabase
- 提供 `/api/map-data`
- 前端从 API 获取数据

说明：

> 一期前端必须支持“静态数据模式”优先开发，避免因为后端和部署阻塞核心页面。

---

## 八、前端目录与组件清单

```text
.mcp.json

app/
  layout.tsx
  page.tsx
  map/silk-road/
    page.tsx
  about/page.tsx
  sources/page.tsx
  api/
    map-data/route.ts
    places/[id]/route.ts
    sources/route.ts
    search/route.ts

components/
  map/
    MapContainer.tsx
    PlacesLayer.tsx
    RoutesLayer.tsx
    MapControls.tsx
  timeline/
    TimelineBar.tsx
  panel/
    DetailPanel.tsx
    PeriodNote.tsx
    RelatedPlaces.tsx
  search/
    SearchBar.tsx
    SearchDropdown.tsx
  ui/
    Badge.tsx
    SourceTag.tsx

store/
  mapStore.ts

lib/
  supabase.ts
  mapConfig.ts
  periodFilter.ts
  searchPlaces.ts
  formatSource.ts

data/
  seed/
    silk-road-seed.json

types/
  map.ts
```

### 8.1 新增建议文件

相较 v1.0，建议补这两个：

- `lib/searchPlaces.ts`：统一搜索逻辑
- `types/map.ts`：集中定义前端类型

---

## 九、Zustand Store 设计

```ts
interface MapState {
  selectedPlace: Place | null
  activePeriod: 'han' | 'tang' | 'song-yuan'
  searchQuery: string
  isPanelOpen: boolean
  isLoading: boolean
  error: string | null

  places: Place[]
  routes: Route[]
  periods: Period[]
  sources: Source[]

  selectPlace: (place: Place | null) => void
  setActivePeriod: (period: PeriodId) => void
  setSearchQuery: (q: string) => void
  closePanel: () => void
  loadMapData: () => Promise<void>

  filteredPlaces: () => Place[]
  searchResults: () => Place[]
}
```

### 9.1 补充说明

相较 v1.0，本版增加：

- `error`
- `sources`
- `PeriodId` 类型收紧

这样可以更直接支撑：

- 加载失败状态
- 来源标签展示
- 严格类型约束

---

## 十、开发阶段拆分

### 阶段 A：本地静态数据跑通（约 5～7 天）

目标：地图 + 静态数据 + 核心交互可完整演示

#### A1. 项目初始化
- [ ] 初始化 `Next.js 16 + Tailwind`
- [ ] 确认 `React 19` 版本一致
- [ ] 配置 `.mcp.json` 启用 `next-devtools-mcp`
- [ ] 安装 MapLibre GL JS
- [ ] 建立目录结构
- [ ] 定义 `types/map.ts`

#### A2. 静态数据闭环
- [ ] 建 `data/seed/silk-road-seed.json`
- [ ] 先录入 8～10 个节点做首轮验证
- [ ] 补入 2 条路线 + 3 个时期 + sources

#### A3. 地图主流程
- [ ] MapContainer 跑通
- [ ] 渲染 PlacesLayer
- [ ] 渲染 RoutesLayer
- [ ] 实现 hover / click / selected 状态
- [ ] 实现详情面板

#### A4. 核心交互
- [ ] 时期切换
- [ ] 本地搜索
- [ ] flyTo + 打开面板
- [ ] 加载与空状态

**阶段完成标志**
- 本地浏览器中可以完整演示地图主流程
- 无需数据库也可展示完整 Demo

---

### 阶段 B：接入数据库与上线（约 3～5 天）

目标：把静态原型升级为可访问的线上版本

- [ ] Supabase 建表
- [ ] 导入脚本或手工导入数据
- [ ] 实现 `app/api/map-data/route.ts`
- [ ] 实现 `app/api/places/[id]/route.ts`
- [ ] 动态 Route Handler 中异步读取 `params`
- [ ] 完成 `/sources`
- [ ] 完成 `/about`
- [ ] 配置 Vercel 环境变量
- [ ] 接入正式域名
- [ ] Cloudflare 配置 DNS / HTTPS / 代理
- [ ] 基础 SEO 与页面级 metadata

**阶段完成标志**
- 有线上域名可访问
- 数据从 API 提供
- 来源与项目说明页面可浏览

---

### 阶段 C：体验打磨（约 3～5 天）

目标：提升展示质量，使其适合作品集或对外展示

- [ ] 底图样式优化
- [ ] 节点图标类型区分
- [ ] 面板滑入/滑出动画
- [ ] 时期切换淡入淡出
- [ ] 图例面板
- [ ] 响应式基础优化（桌面优先）
- [ ] 错误状态和加载状态细化

**阶段完成标志**
- 视觉风格统一
- 交互流畅
- 截图或录屏可直接用于展示

---

## 十一、数据准备任务清单

说明：这部分是一期真正的关键路径之一，允许与开发并行。

- [ ] 用 Claude 生成 25 个节点 JSON 初稿
- [ ] 核验每个节点经纬度
- [ ] 绘制 2 条路线 GeoJSON
- [ ] 为每个节点写 2～3 句中文简介
- [ ] 填写 `periods`
- [ ] 填写 `period_notes`
- [ ] 标注 `certainty`
- [ ] 填写 `related_place_ids`
- [ ] 归档 `source_ids`
- [ ] 整理 3～5 条来源

### 11.1 执行建议

不要等 25 个节点全部准备完再开发。建议顺序：

1. 先做 8～10 个高确定性节点
2. 跑通界面和主流程
3. 再补齐剩余节点

### 11.2 节点优先级建议

第一批建议先做：

- 长安
- 洛阳
- 敦煌
- 玉门关
- 楼兰
- 疏勒
- 撒马尔罕
- 广州
- 泉州
- 亚丁

原因：

- 用户认知强
- 地理跨度明显
- 陆路海路都能覆盖
- 足够验证主要交互链路

---

## 十二、环境变量与部署配置

### 12.1 环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Map tiles（若使用 MapTiler）
NEXT_PUBLIC_MAPTILER_KEY=
```

### 12.2 Vercel 部署说明

一期默认使用 Vercel：

- 连接 Git 仓库
- 在 Vercel 控制台配置环境变量
- 自动构建 Next.js 应用
- 绑定自定义域名
- 保持默认 `next dev` / `next build`，接受 Next.js 16 的 Turbopack 默认行为

### 12.2.1 MCP 配置

为了配合 coding agent 与开发期诊断，项目根目录可加入：

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

### 12.3 Cloudflare 角色

Cloudflare 在一期中只承担：

- DNS 解析
- HTTPS / 代理
- 域名管理

不承担：

- Pages 运行时
- Next.js 应用构建
- Edge Functions 适配

---

## 十三、空状态、错误状态与降级策略

### 13.1 加载状态

- 页面首次加载时显示 loading overlay 或 skeleton
- 地图容器未 ready 前避免渲染交互层

### 13.2 错误状态

当地图数据加载失败时：

- 显示“数据加载失败”
- 提供“重试”按钮
- 保留顶部导航与基础页面结构

### 13.3 搜索空状态

- 无结果时显示“未找到相关节点”
- 不清空用户输入

### 13.4 内容缺失降级

- 某节点缺少某时期说明：显示占位文案
- 缺少来源：标注“来源待补充”
- 缺少相关节点：模块隐藏

---

## 十四、SEO 最小集合

一期只做基础 SEO：

- `/map/silk-road`：title + description
- `/about`：title + description
- `/sources`：title + description
- Open Graph 基础信息
- favicon 与站点名称

说明：地图页的 SEO 不是一期重点，不为复杂 SEO 方案增加额外工作量。

---

## 十五、成功标准

一期 MVP 达到以下体验即视为成功：

1. 打开网站 3 秒内地图可见、节点已渲染
2. 点击任意当前时期节点，1 秒内详情面板打开
3. 切换时期后，节点状态即时变化
4. 搜索“敦煌”可找到并定位到节点
5. 来源说明页可解释数据精度与来源依据
6. 有可访问域名，可直接发链接给别人查看

---

## 十六、开发执行总原则

开发时统一遵守以下规则：

1. **先静态数据，后 API**
2. **先主流程，后视觉打磨**
3. **先桌面端可演示，后考虑移动端优化**
4. **先保证内容可解释，再追求数据完美**
5. **所有容易引起返工的数据字段优先定死**

---

## 十七、一句话总结

> 一期目标是：基于 `Next.js 16` + MapLibre 做出一个可上线演示的丝绸之路互动地图，先用本地静态数据跑通地图、节点、时期、搜索、详情面板，再接 Supabase 和 Vercel 部署，Cloudflare 只负责域名层。
