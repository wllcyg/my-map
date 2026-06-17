import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 定义多条核心线路，使用数据库里的节点名
const ITINERARIES = [
  {
    name: 'Northern Land Route (北线)',
    type: 'land',
    periods: ['han', 'tang', 'mongol'],
    waypoints: ['长安', '兰州', '敦煌', '吐鲁番', '喀什', '碎葉城', '撒马尔罕', '木鹿', '德黑兰', '巴格达', '帕尔米拉', '大马士革', '安条克', '君士坦丁堡', '罗马']
  },
  {
    name: 'Southern Land Route (南线)',
    type: 'land',
    periods: ['han', 'tang'],
    waypoints: ['敦煌', '若羌', '和田', '喀什'] // 绕行塔克拉玛干沙漠南缘
  }
]

async function getPlaceCoordinates(name: string): Promise<[number, number] | null> {
  const { data, error } = await supabase
    .from('places')
    .select('longitude, latitude')
    .ilike('name', `%${name}%`)
    .limit(1)

  if (error || !data || data.length === 0) {
    console.warn(`Place not found: ${name}`)
    return null
  }
  return [data[0].longitude, data[0].latitude]
}

async function generateRoutes() {
  console.log('Generating route geometries using OSRM routing API...')

  for (const itinerary of ITINERARIES) {
    console.log(`Processing itinerary: ${itinerary.name}`)
    
    // 1. 获取所有途经点的坐标
    const coords: [number, number][] = []
    for (const placeName of itinerary.waypoints) {
      const coord = await getPlaceCoordinates(placeName)
      if (coord) {
        coords.push(coord)
      }
    }

    if (coords.length < 2) {
      console.warn(`Not enough valid waypoints for ${itinerary.name}. Skipping.`)
      continue
    }

    // 2. 调用 OSRM API (开源免费路由引擎，无需 Token)
    // 采用 driving 模式来生成相对平滑和合理的陆地/海岸路径
    const coordinatesString = coords.map(c => `${c[0]},${c[1]}`).join(';')
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`

    try {
      console.log(`Calling OSRM API for ${itinerary.name}...`)
      const response = await fetch(osrmUrl)
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      const data: any = await response.json()
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found from OSRM')
      }

      // 获取 GeoJSON LineString 的坐标数组
      const routeGeometry = data.routes[0].geometry.coordinates

      // 3. 存入 Supabase 数据库
      const routeId = `route_${itinerary.name.split(' ')[0].toLowerCase()}`
      
      const { error } = await supabase
        .from('routes')
        .upsert({
          id: routeId,
          name: itinerary.name,
          type: itinerary.type,
          periods: itinerary.periods,
          coordinates: routeGeometry, // 完整的折线点序列
          description: `从 ${itinerary.waypoints[0]} 到 ${itinerary.waypoints[itinerary.waypoints.length - 1]} 的真实地理走向。`
        })

      if (error) {
        console.error(`Failed to save route ${itinerary.name}:`, error)
      } else {
        console.log(`Successfully generated and saved ${itinerary.name} with ${routeGeometry.length} points!`)
      }

    } catch (error) {
      console.error(`Error generating route ${itinerary.name}:`, error)
      
      // 如果 OSRM 失败（例如海路 OSRM driving 不支持跨越大洋），降级为直线连接
      console.log('Falling back to straight line segments...')
      await supabase.from('routes').upsert({
        id: `route_${itinerary.name.split(' ')[0].toLowerCase()}`,
        name: itinerary.name,
        type: itinerary.type,
        periods: itinerary.periods,
        coordinates: coords,
        description: `(Fallback) 从 ${itinerary.waypoints[0]} 到 ${itinerary.waypoints[itinerary.waypoints.length - 1]}。`
      })
    }
  }

  console.log('Route generation completed.')
}

generateRoutes()
