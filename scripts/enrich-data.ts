import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const apiKey = 'sk-7b1beec43b0d443091112a93367a9137'


const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const BATCH_SIZE = 15

async function processBatch(batch: any[]) {
  const prompt = `
你是一位专门研究丝绸之路历史的地理与历史学家。
我将给你一个 JSON 数组，包含了一批从 Wikidata 抓取的历史城市/遗址数据。
请你仔细分析它们，并返回一个包含相同数量对象的 JSON 数组。

对于每个对象，你需要提供：
1. "description": 翻译并改写英文简介，用优雅的中文写一段 30-80 字的历史简介，适合在地图弹窗中展示。
2. "type": 根据它的历史地位，必须是 ["metropolis", "oasis", "checkpoint", "ruin", "port"] 中的一个。
   - metropolis: 帝国都城或极其繁华的超大城市（如长安、撒马尔罕）
   - oasis: 重要的绿洲城市或商贸枢纽
   - port: 海上丝绸之路的核心港口或沿海商贸重镇（如泉州、马六甲、亚丁）
   - checkpoint: 关隘、小镇或军事堡垒
   - ruin: 目前仅剩下废墟的考古遗址
3. "importance": 一个 1-5 的整数。
   - 5: 闻名世界的顶级节点（会在全球视角的地图上一直显示）
   - 4: 区域核心大城市或关键港口
   - 3: 普通重要城市
   - 2: 小型遗址或城镇
   - 1: 极其冷门的遗址

以下是输入数据：
${JSON.stringify(batch.map(b => ({ name: b.name, desc: b.description })), null, 2)}

请仅返回纯 JSON 数组，不要包含任何 markdown 代码块标记，不要多余的话。
`

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content.trim()
    
    // Clean potential markdown blocks
    const cleanJson = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    
    return JSON.parse(cleanJson)
  } catch (error) {
    console.error('Batch processing error:', error)
    return null
  }
}

async function enrichData() {
  const inputFile = process.argv[2] || 'wikidata-places.json'
  const outputFile = process.argv[3] || 'enriched-places.json'
  
  const inputPath = path.join(process.cwd(), 'data', inputFile)
  const outputPath = path.join(process.cwd(), 'data', outputFile)

  const rawData = await fs.readFile(inputPath, 'utf-8')
  const places = JSON.parse(rawData)
  const enrichedPlaces = []

  console.log(`Starting enrichment for ${places.length} places using qwen-turbo...`)

  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    console.log(`Processing batch ${i / BATCH_SIZE + 1} / ${Math.ceil(places.length / BATCH_SIZE)}...`)
    const batch = places.slice(i, i + BATCH_SIZE)
    const enrichedResults = await processBatch(batch)

    if (enrichedResults && enrichedResults.length === batch.length) {
      for (let j = 0; j < batch.length; j++) {
        enrichedPlaces.push({
          ...batch[j],
          description: enrichedResults[j].description,
          type: enrichedResults[j].type,
          importance: enrichedResults[j].importance
        })
      }
    } else {
      console.log('Batch failed or length mismatch. Skipping / saving original batch.')
      // Fallback
      enrichedPlaces.push(...batch.map((b: any) => ({
        ...b,
        type: 'ruin',
        importance: 1
      })))
    }

    // Small delay to prevent rate limiting
    await new Promise(r => setTimeout(r, 1000))
  }

  await fs.writeFile(outputPath, JSON.stringify(enrichedPlaces, null, 2), 'utf-8')
  console.log(`Enrichment complete! Saved to ${outputPath}`)
}

enrichData()
