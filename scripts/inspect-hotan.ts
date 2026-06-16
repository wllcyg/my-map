import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
  // 1. Check Hotan coordinates
  const { data: hotan, error: err1 } = await supabase
    .from('places')
    .select('*')
    .ilike('name', '%和田%')
  
  console.log('Hotan records in DB:')
  console.log(JSON.stringify(hotan, null, 2))

  // 2. Check Southern route coordinates and endpoints
  const { data: route, error: err2 } = await supabase
    .from('routes')
    .select('*')
    .eq('id', 'route_southern')
    .single()

  if (err2) {
    console.error('Error fetching route_southern:', err2.message)
    return
  }

  console.log('\nSouthern Route Info:')
  console.log(`ID: ${route.id}`)
  console.log(`Name: ${route.name}`)
  console.log(`Periods: ${JSON.stringify(route.periods)}`)
  console.log(`Coords length: ${route.coordinates?.length}`)
  if (route.coordinates && route.coordinates.length > 0) {
    console.log(`Start point: ${JSON.stringify(route.coordinates[0])}`)
    console.log(`End point: ${JSON.stringify(route.coordinates[route.coordinates.length - 1])}`)
  }
}

inspect()
