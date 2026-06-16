import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs/promises'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 映射表：哪些 QID 对应已有的 p_... ID
const EXISTING_PORTS_MAP: Record<string, string> = {
  'Q68695': 'p_quanzhou',
  'Q16572': 'p_guangzhou',
  'Q42780': 'p_ningbo',
  'Q61089': 'p_malacca',
  'Q28729': 'p_calicut',
  'Q888643': 'p_hormuz',
  'Q131694': 'p_aden',
  'Q2449': 'p_mogadishu',
  'Q87': 'p_alexandria',
  'Q220': 'p_rome'
}

// 需要从数据库删除的错误/废弃 QID (包含错误的 QID 以及重复的 Q220)
const WRONG_IDS_TO_DELETE = [
  'Q1049',   // 错误：苏丹 (应该是宁波)
  'Q1288',   // 错误：喀爾巴阡山脈 (应该是科伦坡)
  'Q1361',   // 错误：海得拉巴 (应该是热那亚)
  'Q1850',   // 错误：金边 (应该是福州)
  'Q3094',   // 错误：Căldărușani Monastery (应该是吉达)
  'Q35600',  // 错误：乌拉尔山脉 (应该是威尼斯)
  'Q54433',  // 错误：2010年巴西大奖赛 (应该是亚丁)
  'Q80989',  // 错误：博帕尔 (应该是苏拉特)
  'Q236316', // 错误：Voyvozh (应该是霍尔木兹)
  'Q332219', // 错误：赫爾辛基奧林匹克體育場 (应该是马斯喀特)
  'Q220'     // 重复：罗马 (我们保留已有的 p_rome)
]

async function run() {
  console.log('=== STARTING MARITIME DATA CLEANUP AND IMPORT ===\n')

  // 1. 删除错误和重复的 QID
  console.log(`Deleting ${WRONG_IDS_TO_DELETE.length} wrong/duplicate places from database...`)
  const { error: deleteError } = await supabase
    .from('places')
    .delete()
    .in('id', WRONG_IDS_TO_DELETE)

  if (deleteError) {
    console.error('Error deleting wrong IDs:', deleteError.message)
  } else {
    console.log('Successfully cleaned up incorrect/duplicate places!')
  }

  // 2. 读取 enriched-maritime-places.json
  const dataPath = path.join(process.cwd(), 'data', 'enriched-maritime-places.json')
  const rawData = await fs.readFile(dataPath, 'utf-8')
  const places = JSON.parse(rawData)

  console.log(`Processing ${places.length} ports from JSON data...`)

  for (const place of places) {
    const qid = place.wikidata_id
    const isExisting = qid in EXISTING_PORTS_MAP

    const targetId = isExisting ? EXISTING_PORTS_MAP[qid] : qid
    const cleanName = place.name.replace(/市$/, '').replace(/港$/, '') // 规范化命名，如 "广州市" -> "广州"

    const placeRecord: any = {
      id: targetId,
      name: cleanName,
      description: place.description,
      type: targetId === 'p_rome' ? 'capital' : place.type || 'port',
      importance: (place.importance || 4).toString(),
      longitude: place.longitude,
      latitude: place.latitude,
      cover_image_url: place.cover_image_url,
      certainty: 'confirmed',
      geom: {
        type: 'Point',
        coordinates: [place.longitude, place.latitude]
      }
    }

    if (isExisting) {
      // 更新已有的港口
      console.log(`Updating existing port: ${cleanName} (ID: ${targetId})`)
      // 为已有港口更新字段，但保留其已有的 periods
      const { error: updateError } = await supabase
        .from('places')
        .update({
          description: placeRecord.description,
          longitude: placeRecord.longitude,
          latitude: placeRecord.latitude,
          cover_image_url: placeRecord.cover_image_url,
          geom: placeRecord.geom,
          type: placeRecord.type,
          importance: placeRecord.importance
        })
        .eq('id', targetId)

      if (updateError) {
        console.error(`Failed to update ${cleanName}:`, updateError.message)
      }
    } else {
      // 插入新港口
      console.log(`Inserting new port: ${cleanName} (ID: ${targetId})`)
      placeRecord.periods = [] // 留给 enrich-periods.ts 填充
      const { error: insertError } = await supabase
        .from('places')
        .upsert(placeRecord, { onConflict: 'id' })

      if (insertError) {
        console.error(`Failed to insert ${cleanName}:`, insertError.message)
      }
    }
  }

  console.log('\n=== IMPORT COMPLETE ===')
}

run()
