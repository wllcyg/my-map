# 丝绸之路互动地图 · 一期开发任务清单

版本：v1.1 · 日期：2026-06-16  
对应规格：`silk-road-mvp-v1.1-exec.md`  
实施基线：`Next.js 16` + `React 19` + `TypeScript` + `App Router` + `Tailwind CSS` + `shadcn/ui` + `MapLibre GL JS` + `Zustand` + `Supabase` + `Next DevTools MCP`

---

## 一、文档目的

这份文档用于把 `v1.1` 执行版规格继续下沉为：

1. **按天推进的开发排期**
2. **按模块拆分的任务清单**
3. **每个阶段的交付物与完成标准**
4. **哪些任务可以并行，哪些必须串行**

适用场景：

- 你一个人推进项目
- 需要每天知道“今天该做什么”
- 需要避免卡在数据、部署或细节返工上

补充说明：本文已按 **`Next.js 16 + App Router`** 的实现方式重写，默认采用以下约束：

- 页面路由使用 `app/` 目录，不使用 Pages Router
- 地图相关组件统一作为 **Client Component** 实现，必要时使用 `dynamic(..., { ssr: false })`
- 页面壳子、静态页面、metadata、Route Handlers 均走 Next.js 16 原生能力
- API 路由统一放在 `app/api/**/route.ts`
- `params`、`searchParams`、动态 Route Handler 的 `segmentData.params` 一律按异步访问处理
- Next.js 16 默认使用 Turbopack，避免在一期引入不必要的自定义 Webpack 配置
- 项目根目录可配置 `.mcp.json` 启用 `next-devtools-mcp`，用于开发期诊断与 agent 协作
- 业务状态统一由 `Zustand` 管理，地图实例不直接放入 React 服务端组件

---

## 二、总排期建议

一期建议按 **12 个工作日** 规划，分为 3 个阶段：

| 阶段 | 时间 | 目标 |
|------|------|------|
| 阶段 A | Day 1 - Day 5 | 用本地静态数据跑通地图主流程 |
| 阶段 B | Day 6 - Day 9 | 接入 Supabase、API、静态页面、上线 |
| 阶段 C | Day 10 - Day 12 | 做视觉和交互打磨，达到可展示水平 |

> 如果数据准备速度较慢，可把数据整理与阶段 A / B 并行进行，不必完全串行。

---

## 三、UI 组件策略

一期默认采用 **`shadcn/ui` + Tailwind CSS** 作为通用 UI 组件方案，以降低开发时间，同时保留地图页的自定义能力。

### 采用原则

- 地图本体（MapLibre 容器、点线图层、地图交互）自己实现
- 通用界面组件优先使用 `shadcn/ui`
- 特殊视觉效果用 Tailwind 做定制，不额外引入重型组件库

### 一期建议安装的最小组件

- `button`
- `input`
- `sheet`
- `popover`
- `tooltip`
- `badge`
- `separator`
- `accordion`
- `skeleton`
- `card`
- `command`

### 页面与组件映射建议

- 地图详情面板：`Sheet`、`Separator`、`Badge`
- 搜索框与结果下拉：`Input`、`Command`、`Popover`
- 时期说明折叠：`Accordion`
- 来源与关于页：`Card`、`Separator`
- 加载状态：`Skeleton`
- Hover 提示与辅助说明：`Tooltip`

---

## 四、按天排期

---

## Day 1：项目骨架与基础环境

### 当日目标
建立前端项目骨架，让项目能启动、能访问、能继续往里填功能。

### 任务清单

#### 1. 初始化项目
- [x] 初始化 `Next.js 16 + App Router + TypeScript`
- [x] 确认 `React 19` 与 `react-dom 19` 版本一致
- [x] 在项目根目录创建 `.mcp.json`，启用 `next-devtools-mcp`
- [x] 安装 `Tailwind CSS`
- [x] 安装 `MapLibre GL JS`
- [x] 安装 `Zustand`
- [x] 安装 `@supabase/supabase-js`
- [x] 初始化 `shadcn/ui`
- [x] 安装 `lucide-react`
- [x] 安装首批 `shadcn/ui` 组件：`button`、`input`、`sheet`、`popover`、`tooltip`、`badge`、`separator`、`accordion`、`skeleton`、`card`、`command`

#### 2. 建目录结构
- [x] 建立 `app/`
- [x] 建立 `app/api/`
- [x] 建立 `components/`
- [x] 建立 `store/`
- [x] 建立 `lib/`
- [x] 建立 `types/`
- [x] 建立 `data/`
- [x] 预留 `data/seed/` 目录用于本地种子数据

#### 3. 建页面壳子
- [x] `app/page.tsx` 使用 `redirect('/map/silk-road')`
- [x] `app/map/silk-road/page.tsx` 作为地图页的 Server Component 壳子
- [x] `app/about/page.tsx` 建占位页
- [x] `app/sources/page.tsx` 建占位页
- [x] `app/layout.tsx` 设置基础 metadata
- [x] 建立 `components/ui/` 并确认 `shadcn/ui` 组件输出路径
- [x] 明确地图组件在 `components/map/**` 下使用 `'use client'`

#### 4. 建类型与配置基础
- [x] 建 `types/map.ts`
- [x] 建 `lib/mapConfig.ts`
- [x] 建 `lib/periodFilter.ts`

### 当日产出
- 项目能本地启动
- 基础目录齐全
- 地图页路由已存在

### 完成标准
- `npm run dev` 或 `pnpm dev` 可启动
- 浏览器访问 `/map/silk-road` 成功
- 无明显类型报错

---

## Day 2：静态数据结构与地图初始化

### 当日目标
让地图真正显示出来，并能读取本地静态数据。

### 任务清单

#### 1. 准备首批 seed 数据
先做 8～10 个节点，不追求一次补齐 25 个。

- [x] 建 `data/seed/silk-road-seed.json`
- [x] 写入 `places`
- [x] 写入 `routes`
- [x] 写入 `periods`
- [x] 写入 `sources`

#### 2. 跑通 MapContainer
- [x] 创建 `components/map/MapContainer.tsx`，并标记 `'use client'`
- [x] 在地图页中使用 `dynamic(..., { ssr: false })` 或等价方式隔离浏览器依赖
- [x] 初始化 MapLibre 地图实例
- [x] 配置初始中心点、zoom、边界
- [x] 接入一个简洁底图样式

#### 3. 数据接入方式
- [x] 在地图页的 Client 侧引入本地 seed 数据
- [x] 初始化 Zustand store 数据
- [x] 完成 loading → loaded 的基本流程
- [x] 避免在 Server Component 中直接初始化地图实例

### 当日产出
- 页面可见地图
- 本地静态数据已接入

### 完成标准
- 地图正常渲染
- 控制台无严重报错
- store 中可拿到 places / routes / periods / sources

---

## Day 3：节点与路线渲染

### 当日目标
把地图上的核心可视内容显示出来。

### 任务清单

#### 1. 路线图层
- [x] 创建 `components/map/RoutesLayer.tsx`
- [x] 渲染陆路主线
- [x] 渲染海上丝路
- [x] 按当前时期切换路线颜色

#### 2. 节点图层
- [x] 创建 `components/map/PlacesLayer.tsx`
- [x] 渲染所有节点
- [x] 按 `importance` 控制大小
- [x] 按 `type` 预留不同图标/样式入口

#### 3. 时期过滤逻辑
- [x] 使用 `periodFilter.ts` 实现按时期区分节点状态
- [x] 当前时期节点正常显示
- [x] 非当前时期节点半透明、不可点击

### 当日产出
- 节点和路线可视化已出现
- 时期切换的数据逻辑具备基础能力

### 完成标准
- 地图上能看到点和线
- 唐代默认选中
- 切换时期后节点状态变化正确

---

## Day 4：交互主流程（点击、hover、详情面板）

### 当日目标
让用户能“点一个节点看到内容”。

### 任务清单

#### 1. hover 与 selected 状态
- [x] 节点 hover 显示 tooltip（通过改变鼠标指针样式实现）
- [x] 当前时期节点支持 hover 放大（可选优化，目前通过指针变化提示交互）
- [x] 节点点击后进入 selected 状态

#### 2. 详情面板
- [x] 创建 `components/panel/DetailPanel.tsx`
- [x] 使用 `shadcn/ui` 的 `Sheet`、`Badge`、`Separator`
- [x] 展示名称、别名、类型、简介
- [x] 展示 certainty
- [x] 支持关闭面板

#### 3. 时期说明与相关节点
- [x] 创建 `PeriodNote.tsx` (已整合到 DetailPanel 提升聚合度)
- [x] 创建 `RelatedPlaces.tsx` (已整合到 DetailPanel 提升聚合度)
- [x] 展示 `period_notes`
- [x] 展示 `related_place_ids`

#### 4. Store 联动
- [x] `selectPlace`
- [x] `closePanel`
- [x] `isPanelOpen`

### 当日产出
- 用户点击地图节点后可以看到详情

### 完成标准
- 点击节点可打开右侧面板
- 关闭按钮可用
- 切换节点时面板内容正确变化

---

## Day 5：搜索与主流程收口

### 当日目标
完成一期最关键的地图交互闭环。

### 任务清单

#### 1. 搜索组件
- [x] 创建 `SearchBar.tsx`
- [x] 创建 `SearchDropdown.tsx`
- [x] 使用 `shadcn/ui` 的 `Input`、`Command`、`Popover`
- [x] 创建 `lib/searchPlaces.ts`
- [x] 实现 `name + aliases` 搜索

#### 2. 搜索交互
- [x] 空输入不显示下拉
- [x] 无结果显示空状态
- [x] 点击搜索结果后 `flyTo`
- [x] 自动选中节点并打开面板

#### 3. 时间轴 UI
- [x] 创建 `TimelineBar.tsx`
- [x] 3 个固定时期按钮
- [x] 当前时期高亮
- [x] 点击切换 activePeriod

#### 4. 收口检查
- [x] 首屏加载状态
- [x] 面板空字段降级
- [x] 搜索和时间轴不互相打架

### 当日产出
- 本地静态版 MVP 主流程完整闭环

### 完成标准
- 地图 + 点 + 线 + 时期 + 搜索 + 面板 全部可用
- 可以录一段本地演示视频

---

## Day 6：数据完善与结构固化

### 当日目标
补齐剩余数据，冻结一期数据结构。

### 任务清单

#### 1. 完善节点数据
- [x] 从 10 个节点扩充到 25 个
- [x] 补齐 `description`
- [x] 补齐 `periods`
- [x] 补齐 `period_notes`
- [x] 补齐 `certainty`
- [x] 补齐 `related_place_ids`

#### 2. 完善路线与来源
- [x] 检查 2 条路线 GeoJSON
- [x] 补齐 `source_ids`
- [x] 整理来源列表

#### 3. 数据校验
- [x] 检查 ID 唯一性
- [x] 检查 `source_ids` 是否都能映射到来源
- [x] 检查 `related_place_ids` 是否都存在
- [x] 检查时期枚举是否合法

### 当日产出
- 一期 seed 数据结构冻结

### 完成标准
- `data/seed/silk-road-seed.json` 可作为数据库导入源
- 无明显缺字段和坏引用

---

## Day 7：Supabase 建表与 API 打通

### 当日目标
让数据能从 API 拿，而不只是从本地 JSON 读。

### 任务清单

#### 1. Supabase 结构
- [x] 建立 `places`
- [x] 建立 `routes`
- [x] 建立 `periods`
- [x] 建立 `sources`

#### 2. 数据导入
- [x] 手工导入或写脚本导入数据
- [x] 验证表中记录数量正确

#### 3. Route Handlers
- [x] 实现 `app/api/map-data/route.ts`
- [x] 预留 `app/api/places/[id]/route.ts` 等单点接口
- [x] 预留 `app/api/search/route.ts`

#### 4. Supabase 封装
- [x] 创建 `lib/supabase.ts`
- [x] 抽象查询方法
- [x] 明确服务端查询与客户端请求边界
- [ ] `app/api/places/[id]/route.ts` 中按 Next.js 16 规则异步读取 `params`

### 当日产出
- 后端数据接口初步可用

### 完成标准
- 访问 `/api/map-data` 能返回完整 JSON
- API 返回结构与 `v1.1` 一致

---

## Day 8：前端切换到 API 数据源

### 当日目标
把前端从“静态数据模式”切到“API 模式”。

### 任务清单

#### 1. Store 加载逻辑
- [x] 完善 `loadMapData()`
- [x] 读取 `/api/map-data`
- [x] 正确设置 `isLoading`
- [x] 正确设置 `error`

#### 2. 页面接入
- [x] 地图页保持“Server 壳子 + Client 地图主体”的结构
- [x] 地图页改为优先使用 API 数据
- [x] 保留静态数据 fallback 策略（可选）

#### 3. 错误与空状态
- [x] 数据加载失败显示 retry
- [x] 空数据时给出占位说明

### 当日产出
- 前端可从接口正常拿数据

### 完成标准
- 本地环境使用 API 渲染页面成功
- API 数据与本地静态结果一致

---

## Day 9：静态页面与首次上线

### 当日目标
补齐 `about / sources`，并完成第一次线上部署。

### 任务清单

#### 1. `/sources`
- [x] 列出来源清单
- [x] 解释 `confirmed / approximate / disputed`
- [x] 说明一期数据局限

#### 2. `/about`
- [x] 说明项目定位
- [x] 说明一期边界
- [x] 说明后续规划

#### 3. SEO 最小集合
- [x] 地图页 metadata
- [x] about metadata
- [x] sources metadata
- [x] OG 基础信息
- [x] 按需使用页面级 `generateMetadata`

#### 4. Vercel 部署
- [ ] 配置环境变量
- [ ] 首次部署到 Vercel
- [ ] 绑定域名
- [ ] Cloudflare 配置 DNS

### 当日产出
- 可访问的线上版本

### 完成标准
- 自定义域名可打开项目
- 主地图页、about、sources 都能访问

---

## Day 10：地图视觉优化

### 当日目标
把“能用”提升到“能展示”。

### 任务清单

#### 1. 底图与色彩
- [x] 优化底图样式
- [x] 调整背景色、海洋色
- [x] 弱化现代元素

#### 2. 节点视觉
- [x] 不同 `type` 使用不同视觉表达
- [x] 优化 hover / selected 样式
- [x] 调整高重要度节点层级

#### 3. 路线视觉
- [x] 优化路线粗细
- [x] 优化路线透明度
- [x] 优化时期切换时的色彩统一感

### 当日产出
- 地图视觉明显提升

### 完成标准
- 截图可直接用于对外展示
- 信息层级比 Day 5 更清晰

---

## Day 11：动画、状态与细节打磨

### 当日目标
提升产品完成度，处理边角体验。

### 任务清单

#### 1. 动画
- [x] 面板滑入 / 滑出
- [x] 时期切换淡入淡出
- [x] 搜索下拉显隐动画

#### 2. 状态处理
- [x] loading overlay 优化
- [x] retry 按钮优化
- [x] 搜索空状态优化

#### 3. 细节检查
- [x] 长文本溢出
- [x] 别名为空时布局
- [x] `period_notes` 缺失时展示
- [x] source 缺失时展示

### 当日产出
- 产品完成度显著提高

### 完成标准
- 大部分明显“毛边”已处理
- 主流程观感顺滑

---

## Day 12：验收、回归与发布准备

### 当日目标
做一轮完整验收，准备对外演示。

### 任务清单

#### 1. 功能回归
- [ ] 地图加载
- [ ] 节点点击
- [ ] 时期切换
- [ ] 搜索定位
- [ ] 详情面板
- [ ] 来源页
- [ ] 关于页

#### 2. 内容回归
- [ ] 核对重点节点文案
- [ ] 核对来源标题与链接
- [ ] 核对 certainty 展示

#### 3. 部署回归
- [ ] 检查线上构建日志
- [ ] 检查域名解析
- [ ] 检查环境变量是否正确

#### 4. 发布准备
- [ ] 截图首页
- [ ] 截图节点详情
- [ ] 截图来源页
- [ ] 准备一段项目说明文案

### 当日产出
- 一期可发布 / 可演示版本

### 完成标准
- 满足 `v1.1` 中定义的成功标准
- 可以发给别人直接体验

---

## 五、按模块拆分任务

---

## 模块 A：项目基础设施

### 目标
把项目运行骨架搭起来，保证后续开发不乱。

### 任务
- [x] 初始化 `Next.js 16`
- [x] 配置 Tailwind
- [x] 配置 TypeScript
- [x] 确认 `React 19` 版本一致
- [x] 安装 MapLibre / Zustand / Supabase SDK
- [x] 初始化 `shadcn/ui`
- [x] 安装 `lucide-react`
- [x] 安装首批通用组件：`button`、`input`、`sheet`、`popover`、`tooltip`、`badge`、`separator`、`accordion`、`skeleton`、`card`、`command`
- [x] 建立目录结构
- [x] 配置 metadata
- [x] 配置 `.mcp.json` 以启用 `next-devtools-mcp`
- [x] 明确地图模块使用 Client Component 边界

### 交付物
- 可运行项目
- 清晰目录结构
- 可直接复用的 `shadcn/ui` 基础组件

### 优先级
**P0**

---

## 模块 B：领域类型与数据结构

### 目标
把数据字段先定死，减少后续返工。

### 任务
- [x] 定义 `PeriodId`
- [x] 定义 `PlaceType`
- [x] 定义 `Importance`
- [x] 定义 `Certainty`
- [x] 定义 `Place / Route / Period / Source`
- [x] 确认 `source_ids`
- [x] 确认 `related_place_ids`

### 交付物
- `types/map.ts`
- 稳定 seed JSON 结构

### 优先级
**P0**

---

## 模块 C：静态数据准备

### 目标
在不依赖数据库的情况下把 MVP 数据跑起来。

### 任务
- [x] 建 `data/seed/silk-road-seed.json`
- [x] 录入首批 10 个节点
- [ ] 扩充到 25 个节点
- [x] 准备 2 条路线
- [x] 准备 3 个时期
- [x] 准备来源数据
- [x] 校验引用关系

### 交付物
- 可直接被页面读取的 seed 数据文件

### 优先级
**P0**

---

## 模块 D：地图容器与基础配置

### 目标
让地图成为一个稳定、可复用的容器。

### 任务
- [x] 创建 `MapContainer.tsx`
- [x] 标记 `'use client'`
- [x] 初始化地图实例
- [x] 设置初始中心点与缩放
- [x] 设置底图
- [x] 处理地图 ready 状态
- [x] 预留 flyTo 能力
- [x] 处理 `window` / hydration / 浏览器依赖边界

### 交付物
- 基础地图容器组件

### 优先级
**P0**

---

## 模块 E：节点与路线图层

### 目标
完成地图主视觉信息层。

### 任务
- [x] 创建 `PlacesLayer.tsx`
- [x] 创建 `RoutesLayer.tsx`
- [x] 节点大小按 `importance`
- [x] 节点样式按 `type`
- [x] 路线颜色按当前时期
- [x] 非当前时期节点半透明

### 交付物
- 地图上的点和线

### 优先级
**P0**

---

## 模块 F：状态管理

### 目标
统一地图核心交互状态。

### 任务
- [x] 创建 `store/mapStore.ts`
- [x] 管理 `selectedPlace`
- [x] 管理 `activePeriod`
- [x] 管理 `searchQuery`
- [x] 管理 `isPanelOpen`
- [x] 管理 `isLoading / error`
- [x] 实现 `filteredPlaces()`
- [x] 实现 `searchResults()`

### 交付物
- 可供页面和组件共用的状态层

### 优先级
**P0**

---

## 模块 G：详情面板系统

### 目标
把“看地图”升级为“看内容”。

### 任务
- [x] 创建 `DetailPanel.tsx`
- [x] 创建 `PeriodNote.tsx`
- [x] 创建 `RelatedPlaces.tsx`
- [x] 复用 `shadcn/ui` 的 `Sheet`、`Accordion`、`Badge`、`Separator`
- [x] 创建 `Badge.tsx`
- [x] 创建 `SourceTag.tsx`
- [x] 实现关闭、切换、降级展示

### 交付物
- 右侧详情面板完整可用

### 优先级
**P0**

---

## 模块 H：搜索系统

### 目标
让用户能快速定位节点。

### 任务
- [x] 创建 `SearchBar.tsx`
- [x] 创建 `SearchDropdown.tsx`
- [x] 复用 `shadcn/ui` 的 `Input`、`Command`、`Popover`
- [x] 创建 `searchPlaces.ts`
- [x] 精确匹配 + startsWith
- [x] 点击搜索结果触发 flyTo
- [x] 打开详情面板

### 交付物
- 可用搜索体验

### 优先级
**P0**

---

## 模块 I：时间轴系统

### 目标
实现一期最重要的全局筛选器。

### 任务
- [x] 创建 `TimelineBar.tsx`
- [x] 3 个固定时期节点
- [x] 当前时期高亮
- [x] 点击切换 activePeriod
- [x] 联动节点与路线视觉

### 交付物
- 可用时期切换栏

### 优先级
**P0**

---

## 模块 J：数据接口与数据库

### 目标
把静态 Demo 升级为线上可维护版本。

### 任务
- [x] Supabase 建表
- [x] 导入数据
- [x] 创建 `lib/supabase.ts`
- [x] 实现 `app/api/map-data/route.ts`
- [x] 实现 `app/api/places/[id]/route.ts`
- [x] 实现 `app/api/sources/route.ts`
- [x] 预留 `app/api/search/route.ts`

### 交付物
- 稳定的地图数据 API

### 优先级
**P1**

---

## 模块 K：静态页面与 SEO

### 目标
补齐“可给别人看”的外围页面。

### 任务
- [x] 完成 `/about`
- [x] 完成 `/sources`
- [x] 复用 `shadcn/ui` 的 `Card`、`Separator`、`Accordion`
- [x] 配置 metadata
- [x] 配置 OG 基础信息
- [x] 按需使用页面级 `generateMetadata`

### 交付物
- 关于页
- 来源页
- 基础 SEO

### 优先级
**P1**

---

## 模块 L：部署与域名

### 目标
让项目真正在线上可访问。

### 任务
- [x] 配置 Vercel 项目
- [x] 配置环境变量
- [x] 首次部署
- [x] 绑定自定义域名
- [x] Cloudflare 配置 DNS / HTTPS / 代理

### 交付物
- 可公开访问的网址

### 优先级
**P1**

---

## 模块 M：视觉与交互打磨

### 目标
提升展示级别，而不是只停留在“功能通了”。

### 任务
- [x] 底图样式优化
- [x] 节点视觉优化
- [x] 面板动画
- [x] 切换动画
- [x] 图例面板
- [x] 空状态和错误状态优化

### 交付物
- 可展示版本 UI

### 优先级
**P2**

---

## 六、依赖关系与并行建议

### 必须先做的串行任务

1. 模块 A → 模块 B → 模块 C
2. 模块 D → 模块 E → 模块 G / H / I
3. 模块 J 完成后，才能稳定切到 API 模式
4. 模块 L 依赖模块 J / K 基本完成

### 可并行推进的任务

#### 并行组 1
- 数据整理（模块 C）
- 项目初始化（模块 A）

#### 并行组 2
- 地图容器（模块 D）
- 类型定义与 store（模块 B / F）

#### 并行组 3
- `about` 页面（模块 K）
- `sources` 页面（模块 K）
- Supabase 建表（模块 J）

#### 并行组 4
- 视觉优化（模块 M）
- 部署配置（模块 L）

---

## 七、优先级清单（P0 / P1 / P2）

## P0：没有这些就不算 MVP
- [x] 项目初始化
- [x] 类型定义
- [x] 静态 seed 数据
- [x] MapContainer
- [x] PlacesLayer
- [x] RoutesLayer
- [x] TimelineBar
- [x] SearchBar / SearchDropdown
- [x] DetailPanel
- [x] Zustand store

## P1：没有这些就不算“可上线演示版”
- [x] Supabase 建表
- [x] `/api/map-data`
- [x] `/about`
- [x] `/sources`
- [x] Vercel 部署
- [x] 域名接入
- [x] 基础 SEO

## P2：没有这些不影响上线，但影响展示效果
- [x] 图例面板
- [x] 动画细节
- [x] 历史风格底图优化
- [x] 视觉统一性优化
- [x] 更好的错误状态与空状态

---

## 八、里程碑定义

### 里程碑 M1：本地可演示
预计时间：Day 5 结束

满足以下条件：
- 地图可见
- 节点可点
- 路线可见
- 时期可切
- 搜索可用
- 详情面板可用

### 里程碑 M2：线上可访问
预计时间：Day 9 结束

满足以下条件：
- API 可用
- about / sources 可访问
- Vercel 已部署
- 域名已接通

### 里程碑 M3：可对外展示
预计时间：Day 12 结束

满足以下条件：
- 视觉达标
- 动画和状态达标
- 截图和录屏效果良好
- 满足 `v1.1` 成功标准

---

## 九、风险点与应对策略

### 风险 1：数据整理拖慢节奏

**表现**
- 节点文案一直补不完
- 坐标和时期争议导致迟迟不能冻结数据

**应对**
- 先做 10 个高确定性节点
- 剩余节点后补
- 文案可先短，后续再润色

### 风险 2：底图样式调优耗时过多

**表现**
- 一直在纠结底图风格
- 功能没做完却在调视觉

**应对**
- Day 5 前只追求可用
- 底图风格优化放到 Day 10 之后

### 风险 3：部署和 API 阻塞前端进度

**表现**
- 本地地图没跑通就开始折腾环境变量和数据库

**应对**
- 严格执行“先静态数据，后 API”
- Day 5 前不把数据库当阻塞项

### 风险 3.5：地图组件与 Next.js SSR 冲突

**表现**
- 出现 `window is not defined`
- 出现 hydration mismatch
- 页面能开，但地图实例初始化失败

**应对**
- 地图相关组件统一放在 Client Component
- 需要时使用 `dynamic(..., { ssr: false })`
- 不在 Server Component 中直接操作地图实例

### 风险 3.6：Next.js 16 异步请求 API 使用不一致

**表现**
- 动态路由里直接同步读取 `params`
- 页面里直接同步读取 `searchParams`
- `app/api/places/[id]/route.ts` 类型或运行时报错

**应对**
- 页面组件统一使用异步 `params` / `searchParams`
- 动态 Route Handler 中统一 `await segmentData.params`
- 开发初期就按 Next.js 16 规则写法固化模板

### 风险 4：UI 方案摇摆导致返工

**表现**
- 前期一会儿用原生 Tailwind，一会儿换别的组件库
- 同一页面出现多套交互样式和 spacing 规则

**应对**
- 一期统一使用 `shadcn/ui` 作为通用 UI 基础
- 地图层自己写，通用组件尽量不重复造轮子
- 除非遇到明确阻塞，不在一期中途切换组件库

### 风险 5：范围膨胀

**表现**
- 想加移动端、AI、收藏、专题切换

**应对**
- 一切不在 `v1.1` 范围内的内容都记入二期清单
- 一期只保主流程

---

## 十、建议的每日复盘格式

每天结束时建议只回答这 4 个问题：

1. 今天完成了什么？
2. 当前最大阻塞是什么？
3. 明天最关键的一件事是什么？
4. 有没有超出一期范围的想法需要记入 backlog？

这样可以避免项目一路做一路发散。

---

## 十一、一句话总结

> 最稳的推进方式是：前 5 天只盯住本地静态版主流程闭环，Day 6～9 再补数据库、API、静态页面和上线，最后 3 天专门打磨视觉与交互，把它从“能用”推到“能展示”。
