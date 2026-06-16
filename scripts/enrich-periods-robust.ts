import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const apiKey = 'sk-7b1beec43b0d443091112a93367a9137'

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const BATCH_SIZE = 10

async function processBatch(batch: any[]): Promise<any[]> {
  const prompt = `
你是一位专门研究丝绸之路历史的地理与历史学家。
我将给你一个 JSON 数组，包含了一批历史城市/遗址数据。
请你根据它们的名称和简介，判断它们在以下三个历史时期中，是否属于活跃的、繁荣的或实际存在的城邦/节点。

可选的历史时期标识符：
- "han": 汉朝及同时期的罗马帝国、安息帝国时期 (公元前2世纪 - 公元3世纪)
- "tang": 唐朝及同时期的阿拉伯帝国、拜占庭帝国时期 (公元7世纪 - 10世纪)
- "mongol": 蒙元帝国时期及大航海时代前夕 (公元13世纪 - 15世纪)

请返回一个 JSON 数组，包含每个城市对应的 id 和 periods 数组。格式必须如下：
[
  { "id": "城市ID", "periods": ["han", "tang"] }
]

以下是输入数据：
${JSON.stringify(batch.map(b => ({ id: b.id, name: b.name, desc: b.description })), null, 2)}

请仅返回纯 JSON 数组，不要包含任何 markdown 代码块标记，不要包含任何额外的文字解释。
`

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content.trim()

    // Clean potential markdown blocks
    content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')

    const results = JSON.parse(content)
    if (Array.isArray(results)) {
      return results
    }
  } catch (err) {
    console.error('Error processing batch:', err)
  }
  return []
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function run() {
  console.log('Fetching places with empty/null periods...')
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, description, periods')

  if (error) {
    console.error(error)
    return
  }

  const placesToProcess = places.filter(p => !p.periods || p.periods.length === 0)
  console.log(`Found ${placesToProcess.length} places to process.`)

  for (let i = 0; i < placesToProcess.length; i += BATCH_SIZE) {
    const batch = placesToProcess.slice(i, i + BATCH_SIZE)
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(placesToProcess.length / BATCH_SIZE)} (Size: ${batch.length})...`)

    const results = await processBatch(batch)
    
    if (results.length > 0) {
      console.log(`Received results for ${results.length} items. Updating database...`)
      for (const res of results) {
        if (res.id && Array.isArray(res.periods)) {
          // Verify periods
          const validPeriods = res.periods.filter((p: string) => ["han", "tang", "mongol"].includes(p))
          
          const match = batch.find(b => b.id === res.id)
          if (match) {
            console.log(`- Updating "${match.name}" (ID: ${res.id}) -> periods: ${JSON.stringify(validPeriods)}`)
            const { error: updateError } = await supabase
              .from('places')
              .update({ periods: validPeriods })
              .eq('id', res.id)

            if (updateError) {
              console.error(`  Failed to update ${res.id}:`, updateError.message)
            }
          }
        }
      }
    } else {
      console.log('Batch failed or returned empty. Skipping update for this batch.')
    }

    // Small delay to prevent rate limits
    await sleep(1500)
  }

  console.log('\n=== PERIOD ENRICHMENT COMPLETE ===')
}

run()
