import { createClient } from '@supabase/supabase-js'
import * as turf from '@turf/turf'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 1. 东线航路 (无折返)
const EAST_ROUTE = [
  { type: 'place', name: '宁波' },
  { type: 'place', name: '福州' },
  { type: 'place', name: '泉州' },
  { type: 'place', name: '广州' },
  { type: 'coord', coord: [109.0, 10.0] }, // 南海控制点
  { type: 'place', name: '巨港' },
  { type: 'coord', coord: [104.5, -1.0] }, // 绕开新加坡陆地控制点1
  { type: 'coord', coord: [103.8, 1.35] }, // 绕开新加坡陆地控制点2 (新加坡海峡)
  { type: 'place', name: '马六甲' },
  { type: 'coord', coord: [95.0, 6.0] },   // 马六甲出口避开苏门答腊
  { type: 'place', name: '科伦坡' },
  { type: 'place', name: '奎隆' },
  { type: 'place', name: '卡利卡特' },
  { type: 'coord', coord: [67.0, 18.0] },  // 阿拉伯海控制点
  { type: 'place', name: '马斯喀特' },
  { type: 'place', name: '霍尔木兹' },
  { type: 'place', name: '巴士拉' }
]

// 2. 西线航路 - 热那亚航线 (无折返)
const WEST_GENOA_ROUTE = [
  { type: 'place', name: '马斯喀特' },
  { type: 'coord', coord: [53.0, 16.0] },  // 阿拉伯海南部控制点
  { type: 'place', name: '亚丁' },
  { type: 'coord', coord: [43.0, 14.0] },  // 曼德海峡
  { type: 'place', name: '吉达' },
  { type: 'coord', coord: [34.0, 27.0] },  // 苏伊士
  { type: 'place', name: '亚历山大' },
  { type: 'coord', coord: [20.0, 35.0] },  // 克里特岛南部
  { type: 'coord', coord: [15.0, 38.0] },  // 墨西拿海峡
  { type: 'place', name: '罗马' },
  { type: 'place', name: '热那亚' }
]

// 3. 西线航路 - 威尼斯特快航线 (无折返)
const WEST_VENICE_ROUTE = [
  { type: 'place', name: '亚历山大' },
  { type: 'coord', coord: [20.0, 35.0] },  // 克里特岛南部
  { type: 'coord', coord: [18.6, 39.8] },  // 塔兰托湾外 (进入亚得里亚海入口)
  { type: 'coord', coord: [16.5, 42.5] },  // 亚得里亚海中部
  { type: 'place', name: '威尼斯' }
]

// 4. 东非支线 (无折返)
const AFRICA_ROUTE = [
  { type: 'place', name: '亚丁' },
  { type: 'place', name: '摩加迪沙' }
]

async function getPlaceCoordinates(name: string): Promise<[number, number] | null> {
  const { data, error } = await supabase
    .from('places')
    .select('longitude, latitude')
    .ilike('name', `%${name}%`)
    .limit(1)

  if (error || !data || data.length === 0) {
    return null
  }
  return [data[0].longitude, data[0].latitude]
}

async function resolveCoords(flow: any[]) {
  const coords: [number, number][] = []
  for (const item of flow) {
    if (item.type === 'coord') {
      coords.push(item.coord)
    } else {
      const c = await getPlaceCoordinates(item.name)
      if (c) coords.push(c)
      else console.warn(`Not found: ${item.name}`)
    }
  }
  return coords
}

async function generate() {
  console.log('Generating split non-backtracking maritime routes...')

  // 删除老的路线
  await supabase.from('routes').delete().eq('id', 'route_maritime')

  const routesToCreate = [
    { id: 'route_maritime_east', name: 'Maritime Silk Road (东线)', flow: EAST_ROUTE, desc: '从中国东南沿海港口出发，穿过马六甲海峡，横跨印度洋直达波斯湾巴士拉的海上丝路东段。' },
    { id: 'route_maritime_west_genoa', name: 'Maritime Silk Road (热那亚线)', flow: WEST_GENOA_ROUTE, desc: '连接马斯喀特、亚丁、吉达与亚历山大，并直达罗马与热那亚的海上丝路西段西侧主航道。' },
    { id: 'route_maritime_west_venice', name: 'Maritime Silk Road (威尼斯线)', flow: WEST_VENICE_ROUTE, desc: '由亚历山大港直接北上亚得里亚海，通往威尼斯的威尼斯专用海上贸易航线。' },
    { id: 'route_maritime_africa', name: 'Maritime Silk Road (东非支线)', flow: AFRICA_ROUTE, desc: '从亚丁出海，南下红海与印度洋交界，通往东非重镇摩加迪沙的贸易支线。' }
  ]

  for (const r of routesToCreate) {
    const coords = await resolveCoords(r.flow)
    if (coords.length < 2) continue

    const line = turf.lineString(coords)
    // 细分精度设高，使得曲线更加平滑地沿着控制点飞行
    const smoothed = turf.bezierSpline(line, { resolution: 3000, sharpness: 0.85 })
    const smoothedCoords = smoothed.geometry.coordinates

    console.log(`Saving ${r.name} with ${smoothedCoords.length} points.`)

    const { error } = await supabase.from('routes').upsert({
      id: r.id,
      name: r.name,
      type: 'sea',
      periods: ['tang', 'mongol'],
      coordinates: smoothedCoords,
      description: r.desc
    })

    if (error) {
      console.error(`Failed to save ${r.id}:`, error.message)
    }
  }

  console.log('All split routes generated!')
}

generate()
