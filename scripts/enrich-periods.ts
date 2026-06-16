import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const apiKey = 'sk-7b1beec43b0d443091112a93367a9137' // hardcoded as requested by user

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const BATCH_SIZE = 20

async function processBatch(batch: any[]) {
  const prompt = `
你是一位研究古代丝绸之路的历史学家。
我将给你一个 JSON 数组，包含了一批从历史数据库中提取的城市/遗址数据。
请你根据它们的名称和简介，判断它们在以下三个历史时期中，是否属于活跃的、繁荣的或实际存在的城邦/节点。

可选的历史时期标识符：
- "han": 汉朝及同时期的罗马帝国、安息帝国时期 (公元前2世纪 - 公元3世纪)
- "tang": 唐朝及同时期的阿拉伯帝国、拜占庭帝国时期 (公元7世纪 - 10世纪)
- "mongol": 蒙元帝国时期及大航海时代前夕 (公元13世纪 - 15世纪)

请返回一个与输入数组长度相同的 JSON 数组。对于每个输入对象，你需要返回一个只包含 "periods" 字段的对象，"periods" 是一个字符串数组，包含它所活跃的时期标识符。
如果一个城市在这三个时期都很活跃，那就是 ["han", "tang", "mongol"]。
如果一个遗址在汉朝就废弃了，那就是 ["han"]。
如果它是大航海时代才兴起的，可能这三个都不选，返回 []。

以下是输入数据：
${JSON.stringify(batch.map(b => ({ name: b.name, desc: b.description })), null, 2)}

请仅返回纯 JSON 数组，不要包含任何 markdown 代码块标记，不要包含其他解释。
`

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "qwen-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  let content = data.choices[0].message.content.trim()
  
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\n/, '').replace(/\n```$/, '')
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\n/, '').replace(/\n```$/, '')
  }

  return JSON.parse(content)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function enrichPeriods() {
  console.log('Fetching places without periods from Supabase...')
  
  // 找出所有 periods 为空或 null 的记录
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, description, periods')
  
  if (error) {
    console.error('Error fetching places:', error)
    process.exit(1)
  }

  const placesToProcess = places.filter(p => !p.periods || p.periods.length === 0)
  console.log(`Found ${placesToProcess.length} places to enrich.`)

  for (let i = 0; i < placesToProcess.length; i += BATCH_SIZE) {
    const batch = placesToProcess.slice(i, i + BATCH_SIZE)
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(placesToProcess.length / BATCH_SIZE)}...`)

    try {
      const enrichedBatch = await processBatch(batch)

      if (!Array.isArray(enrichedBatch) || enrichedBatch.length !== batch.length) {
        console.error('Batch failed or length mismatch. Skipping / saving empty array.')
        continue
      }

      // Update Supabase
      for (let j = 0; j < batch.length; j++) {
        const place = batch[j]
        const enriched = enrichedBatch[j]

        // 验证确保 periods 是正确的数组
        let validPeriods = []
        if (enriched.periods && Array.isArray(enriched.periods)) {
          validPeriods = enriched.periods.filter((p: string) => ["han", "tang", "mongol"].includes(p))
        }

        // 如果全部都没命中，至少给个空数组避免 null 报错
        await supabase
          .from('places')
          .update({ periods: validPeriods })
          .eq('id', place.id)
      }
      
      console.log(`Successfully updated batch ${Math.floor(i / BATCH_SIZE) + 1}`)

    } catch (err) {
      console.error('Batch processing error:', err)
    }

    // Rate limiting pause
    await sleep(2000)
  }

  console.log('Enrichment complete!')
}

enrichPeriods()
