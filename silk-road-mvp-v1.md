# 丝绸之路互动地图 · 一期最小 MVP 规格

版本：v1.0 · 日期：2026-06-16  
定位：可上线演示、可给人看、可继续迭代  
实施基线：`Next.js 16` + `React 19` + `App Router` + `Tailwind CSS 4` + `MapLibre GL JS` + `Zustand` + `Supabase` + `Next DevTools MCP`

---

## 一、MVP 边界

### 做什么

- 一张丝绸之路互动地图
- 25 个核心历史节点（点位）
- 2 条主路线（陆路主线 + 海上丝路）
- 点击节点 → 右侧详情面板
- 顶部时间轴（3 个时期切换：汉、唐、宋元）
- 关键词搜索
- 来源说明页

### 不做什么（明确排除）

- AI 问答（二期）
- AI 导览（二期）
- 用户登录 / 收藏（三期）
- 后台 CMS（三期）
- 移动端深度适配（二期）
- 多专题（二期）
- 复杂疆域边界面数据

---

## 二、技术栈（统一版本）

| 层级 | 选型 | 说明 |
|------|------|------|
| 前端框架 | Next.js 16 (App Router) | 与当前工程版本一致，主站、SEO、API 一体化 |
| React | React 19 | 与 Next.js 16 配套 |
| 地图库 | MapLibre GL JS 4.x | 历史地图最合适的库 |
| 状态管理 | Zustand | 轻量，适合地图状态 |
| 样式 | Tailwind CSS 4 | 与当前项目初始化配置一致 |
| 数据库 | Supabase Postgres | 免费起步 |
| API 层 | Next.js Route Handlers | 运行在 Next.js App Router 下 |
| Agent 协作 | Next DevTools MCP | 用于开发期错误、路由、元数据与运行时诊断 |
| 部署 | Vercel | 与 Next.js 16 集成最顺畅 |
| 域名/CDN | Cloudflare | 仅负责 DNS、HTTPS、代理 |

> AI 问答暂不接入，Route Handlers 足以支撑一期全部接口需求。  
> 一期默认部署到 `Vercel`，不再为 `Cloudflare Pages` 做运行时适配；`Cloudflare` 仅负责域名、HTTPS 与代理。  
> 若要配合 coding agent，可在项目根目录加入 `.mcp.json` 以启用 `next-devtools-mcp`。

---

## 三、数据规格

### 3.1 节点数据（25 个）

**数据来源优先级**
1. Pleiades 数据库（古代地名坐标，学术级准确）
2. Claude 生成初稿 + Google Maps 人工校验
3. Wikipedia infobox 坐标补充

**节点字段结构**

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
  "source_id": "src_001",
  "period_notes": {
    "han": "汉武帝设敦煌郡，西域都护府前哨。",
    "tang": "唐代贸易最繁盛时期，人口超10万。"
  }
}
```

**节点类型分类**

| type | 含义 | 图标样式 |
|------|------|----------|
| city | 重要城市 / 都城 | 大圆点 |
| pass | 关隘 / 要道 | 菱形 |
| port | 港口 | 锚形 |
| oasis | 绿洲驿站 | 小圆点 |

**25 个节点清单**（陆路 18 + 海路 7）

陆路：长安、洛阳、凉州、敦煌、玉门关、楼兰、于阗、疏勒（喀什）、大宛（费尔干纳）、撒马尔罕、木鹿（梅尔夫）、波斯波利斯、泰西封、安条克、亚历山大港、康居、大月氏故地、蓝氏城

海路：广州、泉州、占城（越南）、马六甲、锡兰（斯里兰卡）、科泽科德（印度）、亚丁

### 3.2 路线数据（2 条）

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
  "source_id": "src_002"
}
```

### 3.3 时期定义

```json
[
  { "id": "han",       "label": "汉代",   "range": [-206, 220],  "color": "#8B4513" },
  { "id": "tang",      "label": "唐代",   "range": [618, 907],   "color": "#C4963C" },
  { "id": "song-yuan", "label": "宋元",   "range": [960, 1368],  "color": "#2E6B5E" }
]
```

### 3.4 来源数据

```json
[
  { "id": "src_001", "title": "Pleiades 古代地名数据库", "url": "https://pleiades.stoa.org", "note": "坐标来源" },
  { "id": "src_002", "title": "《中国历史地图集》谭其骧主编", "year": 1982, "note": "路线走向参考" },
  { "id": "src_003", "title": "UNESCO 丝绸之路在线平台", "url": "https://en.unesco.org/silkroad", "note": "综合参考" }
]
```

---

## 四、页面结构

```
/                    首页（重定向到 /map/silk-road）
/map/silk-road       地图主页面（核心页）
/about               关于项目
/sources             数据来源与说明
```

---

## 五、核心页面详细设计

### 5.1 地图主页面布局

```
┌─────────────────────────────────────────────────────┐
│  Logo · 丝绸之路互动地图          搜索框   来源说明  │  ← 顶部导航栏 56px
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              地图区域（MapLibre）                    │  ← 全屏
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  汉代 ●────────────── 唐代 ──────────────── 宋元    │  ← 时间轴 64px
└─────────────────────────────────────────────────────┘

点击节点后，右侧滑出详情面板（宽 360px）：
┌──────────────────┐
│ × 关闭            │
│ 敦煌              │  ← 标题 20px
│ 沙州 · Dunhuang   │  ← 别名 12px
│ ──────────────   │
│ 🏙 重要城市 · 汉唐宋元│
│ ──────────────   │
│ 河西走廊西端重镇…  │  ← 简介
│                  │
│ 汉代              │  ← 时期说明折叠
│ 唐代 ▼            │
│ 唐代贸易最繁盛…    │
│                  │
│ 相关节点          │
│ · 玉门关  · 楼兰   │
│                  │
│ 来源：谭其骧地图集  │  ← 来源标注
└──────────────────┘
```

### 5.2 地图样式要求

- 底图：MapLibre 使用 `maptiler` 或 `stamen toner-lite`（弱化现代元素）
- 背景色：米黄 `#F5F0E8`，模拟羊皮纸感
- 海洋色：浅蓝 `#C8DDE8`
- 隐藏：现代高速公路标签、商业 POI、地铁线
- 保留：山脉轮廓、主要河流、海岸线、国界（低透明度）

### 5.3 节点图层交互状态

| 状态 | 视觉 |
|------|------|
| 默认 | 彩色圆点，按 importance 控制大小（high=14px / normal=10px） |
| 时期过滤后不显示 | 透明度 0.2，不可点击 |
| Hover | 放大 1.2x + 白色描边 + tooltip 显示名称 |
| Selected | 放大 1.4x + 橙色描边 + 打开详情面板 |

### 5.4 时间轴交互

- 三个固定节点（汉 / 唐 / 宋元），点击切换，不做滑动
- 切换后：当前时期节点正常显示，其他时期节点半透明
- 路线颜色跟随时期主色变化
- 默认选中：唐代（节点最完整）

### 5.5 搜索

- 顶部搜索框，实时过滤（本地 JSON 匹配，无需接口）
- 匹配字段：name + aliases
- 结果下拉列表，点击后地图 flyTo 该节点并打开详情面板
- MVP 不做模糊搜索，精确 + startsWith 即可

---

## 六、数据库表结构（Supabase）

MVP 阶段只建 4 张表：

```sql
-- 节点
create table places (
  id          text primary key,
  name        text not null,
  aliases     text[],
  type        text,
  lat         float8,
  lng         float8,
  periods     text[],
  importance  text default 'normal',
  certainty   text default 'confirmed',
  description text,
  highlights  text[],
  period_notes jsonb,
  source_id   text
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
  source_id   text
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

---

## 七、API 接口（Next.js Route Handlers）

```
GET  /api/map-data          返回当前专题全量数据（places + routes + periods）
GET  /api/search?q=关键词   搜索节点（MVP 可直接在前端 filter，此接口备用）
GET  /api/places/:id        单个节点详情
GET  /api/sources           来源列表
```

### `/api/map-data` 返回结构

```json
{
  "places": [...],
  "routes": [...],
  "periods": [...],
  "meta": {
    "topic": "silk-road",
    "title": "丝绸之路互动地图",
    "updatedAt": "2026-06-16"
  }
}
```

---

## 八、前端组件清单

```
.mcp.json

app/
  layout.tsx               根布局
  page.tsx                 重定向到 /map/silk-road
  map/silk-road/
    page.tsx               地图主页面
  about/page.tsx
  sources/page.tsx
  api/
    map-data/route.ts
    places/[id]/route.ts
    sources/route.ts
    search/route.ts

components/
  map/
    MapContainer.tsx       MapLibre 初始化、底图
    PlacesLayer.tsx        节点图层
    RoutesLayer.tsx        路线图层
    MapControls.tsx        缩放控件
  timeline/
    TimelineBar.tsx        时期切换栏
  panel/
    DetailPanel.tsx        右侧详情面板
    PeriodNote.tsx         时期说明折叠
    RelatedPlaces.tsx      相关节点列表
  search/
    SearchBar.tsx          搜索框
    SearchDropdown.tsx     搜索结果下拉
  ui/
    Badge.tsx              类型标签
    SourceTag.tsx          来源标注

store/
  mapStore.ts              Zustand：选中节点、当前时期、搜索词、面板开关

lib/
  supabase.ts              Supabase client
  mapConfig.ts             地图初始视角、样式配置
  periodFilter.ts          按时期过滤节点的工具函数

data/
  seed/
    silk-road-seed.json    本地备份 / 阶段A直接读取
```

---

## 九、Zustand Store 设计

```typescript
interface MapState {
  // 当前状态
  selectedPlace: Place | null
  activePeriod: 'han' | 'tang' | 'song-yuan'
  searchQuery: string
  isPanelOpen: boolean
  isLoading: boolean

  // 数据
  places: Place[]
  routes: Route[]
  periods: Period[]

  // Actions
  selectPlace: (place: Place | null) => void
  setActivePeriod: (period: string) => void
  setSearchQuery: (q: string) => void
  closePanel: () => void
  loadMapData: () => Promise<void>

  // 派生
  filteredPlaces: () => Place[]   // 按当前时期过滤
  searchResults: () => Place[]    // 按搜索词过滤
}
```

---

## 十、开发阶段拆分

### 阶段 A：本地跑通（约 1 周）

目标：地图 + 静态数据 + 核心交互能跑

- [ ] Next.js 项目初始化
- [ ] MapLibre 接入，地图底图跑通
- [ ] 读取本地 `data/seed/silk-road-seed.json` 渲染节点 + 路线
- [ ] 节点 hover / click 状态
- [ ] 详情面板组件
- [ ] 时期切换（本地 filter）
- [ ] 搜索（本地 filter）

**完成标志**：能在本地浏览器里看到地图、点节点、切时期

---

### 阶段 B：接入数据库上线（约 3～5 天）

目标：数据迁入 Supabase，部署到 Vercel

- [ ] Supabase 建表 + 数据导入脚本
- [ ] 实现 `app/api/map-data/route.ts`
- [ ] 实现 `app/api/places/[id]/route.ts`
- [ ] 动态 Route Handler 中异步读取 `params`
- [ ] 前端改为从 API 取数据
- [ ] 来源说明页 `/sources`
- [ ] 关于页 `/about`
- [ ] 配置 Vercel 环境变量
- [ ] Vercel 部署 + 绑定自定义域名
- [ ] Cloudflare 配置 DNS / HTTPS / 代理
- [ ] 基础 SEO（title/description/og）

**完成标志**：有域名可以访问，能给人发链接看

---

### 阶段 C：体验打磨（约 3～5 天）

目标：视觉和交互达到可展示水平

- [ ] 地图底图样式优化（羊皮纸风格）
- [ ] 节点图标按类型区分（city / pass / port / oasis）
- [ ] 详情面板动画（滑入/滑出）
- [ ] 时期切换动画（节点淡入淡出）
- [ ] 图例面板
- [ ] 错误状态 / 加载状态处理
- [ ] 响应式基础（桌面端 1280px 为主）

**完成标志**：视觉够好，可以放进作品集

---

## 十一、数据准备任务清单

开发之前需要先完成（可以并行）：

- [ ] 用 Claude 生成 25 个节点 JSON 初稿
- [ ] 逐一用 Google Maps 核验经纬度
- [ ] 在 GeoJSON.io 画 2 条路线并导出
- [ ] 给每个节点写 2～3 句中文简介
- [ ] 标注每个节点的 certainty（confirmed / approximate / disputed）
- [ ] 整理 3～5 条数据来源

预计耗时：2～3 天

---

## 十二、环境变量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 地图底图（可选，MapTiler 免费方案）
NEXT_PUBLIC_MAPTILER_KEY=
```

**Vercel 部署说明**

- 在 Vercel 控制台设置环境变量
- 保持默认 `next dev` / `next build`
- 接受 Next.js 16 默认的 Turbopack 行为
- Cloudflare 只负责 DNS / HTTPS / 代理

**MCP 配置（可选）**

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

**动态 Route Handler 写法（Next.js 16）**

```typescript
// app/api/places/[id]/route.ts
export async function GET(
  request: Request,
  segmentData: { params: Promise<{ id: string }> }
) {
  const { id } = await segmentData.params
  // ...
}
```

---

## 十三、成功标准

一期 MVP 上线后，以下体验达标即视为成功：

1. 打开网站 3 秒内地图可见、节点已渲染
2. 点击任意节点，1 秒内详情面板打开
3. 切换时期，地图节点状态即时变化
4. 搜索"敦煌"能找到节点并定位地图
5. 有来源说明页，能解释数据精度
6. 有可访问的域名，可以发给别人看

---

## 十四、一句话总结

> 25 个节点 + 2 条路线 + 3 个时期 + 详情面板 + 搜索 + 来源页，基于 `Next.js 16` 部署到 `Vercel`，2～3 周可上线。
