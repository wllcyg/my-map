# 丝绸之路地图数据丰富化与渲染实施方案

本方案旨在解决当前 Silk Road Map 存在“节点稀疏”、“路线生硬”的问题。通过引入高质量的开源历史与地理数据，结合分级渲染策略（LOD），提升地图的真实感与历史厚重感。

## 阶段一：高质量数据获取与清洗 (Data Acquisition)

为了填补地图上的空白，我们需要从以下三个极具学术价值的公开数据源批量获取数据：

### 1. 维基数据 (Wikidata) 自动化获取
Wikidata 是最快构建 MVP 节点的来源。后续我们将编写 Node.js 或 Python 脚本，通过 SPARQL 语句批量拉取数据。
*   **拉取目标**：“丝绸之路沿线古城”、“汉唐西域三十六国”、“中亚历史名城”。
*   **提取字段**：中文名、英文名、经纬度 (`P625`)、维基百科简介片段、历史图片 URL。
*   **示例 SPARQL 思路**：查询所有 `instance of` 为 `historical city` 且位于 `Silk Road` (或周边特定坐标框内) 的实体。

### 2. 联合国教科文组织 (UNESCO) 核心遗迹
*   **来源**：UNESCO 世界遗产名录：“丝绸之路：长安-天山廊道路网”（编号 1442）。
*   **内容**：官方包含 33 处极高精度的核心遗迹（包含破城子遗址、克孜尔石窟、玉门关等）。
*   **实施方式**：下载其官方提供的 KML 格式地图文件，使用 GIS 工具（如 QGIS）或代码（`@mapbox/togeojson`）将其转换为 GeoJSON 格式。

### 3. Pleiades 古地名数据库（针对中亚及以西）
*   **来源**：Pleiades Dataset (CSV/JSON 格式开源下载)。
*   **实施方式**：筛选 bounding box (包围盒) 在中亚到地中海区域的点，提取希腊化时期、罗马时期、波斯时期的重要节点（如安条克、泰西封、巴克特拉等）。

---

## 阶段二：数据库结构升级 (Database Schema Updates)

为了支撑更丰富的数据类型和后续的地图分层渲染，现有的 Supabase `places` 和 `routes` 表需要进行字段扩充。

### `places` 表扩充
我们需要增加节点类型和权重级别，以便在不同缩放级别下过滤显示。
*   `type` (String/Enum): 节点分类，如 `metropolis` (大都会, 如长安), `oasis` (绿洲/中小城市, 如吐鲁番), `checkpoint` (关隘/烽燧, 如阳关), `ruin` (遗址)。
*   `importance` (Integer, 1-5): 权重级别。`5` 为最高（世界级坐标），`1` 为最低（小型驿站）。用于前端缩放控制。
*   `cover_image_url` (String): 用于在侧边栏显示获取到的维基百科图片。

### `routes` 表扩充
解决路线是“僵硬直线”的问题。
*   `geometry` (JSON/GeoJSON): 弃用简单的点对点数组，改存标准的 GeoJSON `LineString` 或 `MultiLineString`。这将允许我们存储一条包含几百个转折点的弯曲路线（例如完美贴合河西走廊地形的路径）。

---

## 阶段三：自动化脚本落库 (Data Ingestion)

不要手动在后台一个一个录入，实施步骤如下：

1.  **编写导入脚本**：在项目根目录创建 `scripts/import_data.ts`。
2.  **数据转换**：读取下载好的 KML 或 JSON 资料，将经纬度格式统一转换为 `[longitude, latitude]`。
3.  **批量写入**：利用 `@supabase/supabase-js` 的 `upsert` 或 `insert` 方法，将清洗好的数据批量打入远端数据库。
4.  *(可选进阶)*：调用 Mapbox Directions API，传入起点（如敦煌）和终点（如哈密），模式选为 `walking`（步行），获取返回的弯曲路径 GeoJSON，存入 `routes.geometry` 中。

---

## 阶段四：前端地图渲染引擎优化 (Frontend Maplibre Tuning)

有了几百上千个点之后，如果全部显示在屏幕上会造成视觉灾难。必须在 `PlacesLayer.tsx` 中实施以下渲染策略：

### 1. 基于层级的细节控制 (Level of Detail - LOD)
利用 MapLibre 的 `zoom` 特性配合 `filter` 表达式，实现动态显示：
*   **Zoom 2 ~ 4 (俯瞰欧亚大陆)**：只显示 `importance >= 4` 的超级大都会（长安、撒马尔罕、君士坦丁堡），使用较大的图标和文字。
*   **Zoom 5 ~ 7 (国家/区域级)**：显示 `importance >= 3` 的中等城市和关键绿洲。
*   **Zoom 8+ (放大到局部)**：显示所有节点，包括 `checkpoint`（关隘）和 `ruin`（遗址），这些微节点使用极小的圆点渲染，不干扰视线。

**代码思路**：
```javascript
// 在 addLayer 的 filter 配置中
filter: [
  'step',
  ['zoom'],
  ['>=', ['get', 'importance'], 4], // 缩放小于5时
  5, ['>=', ['get', 'importance'], 3], // 缩放>=5时
  8, ['>=', ['get', 'importance'], 1]  // 缩放>=8时全显
]
```

### 2. 视觉符号差异化 (Symbology)
*   不同 `type` 使用不同的样式。例如：`metropolis` 使用带有金色光晕效果的 `circle` 或定制 Icon；`checkpoint`（关隘）使用暗灰色的方形或小圆点，表示它是途经点而非主城。

### 3. 路线平滑渲染 (Route Smoothing)
*   对于尚未拥有真实地形路径的路线，可以在前端利用 `@turf/bezier-spline` 库。在把路线数据喂给地图前，先将点对点的直线转换为具有平滑曲率的弧线，能在视觉上大幅增加“路线感”。

## 执行顺序建议

1.  **先改表结构**：去 Supabase 后台给 `places` 加上 `type` 和 `importance` 字段。
2.  **写脚本灌数据**：我后续可以协助你写一段抓取 Wikidata 或解析 UNESCO 数据的代码并运行。
3.  **调前端渲染**：最后再回到 `PlacesLayer.tsx` 修改渲染条件。
