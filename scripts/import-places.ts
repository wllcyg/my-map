import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importPlaces() {
  const inputFile = process.argv[2] || 'enriched-places.json'
  const dataPath = path.join(process.cwd(), 'data', inputFile)
  
  try {
    const rawData = await fs.readFile(dataPath, 'utf-8')
    const places = JSON.parse(rawData)

    console.log(`Found ${places.length} places to import.`)

    const formattedPlaces = places.map((place: any) => ({
      id: place.wikidata_id, // Use Wikidata ID as the primary key
      name: place.name,
      description: place.description,
      type: place.type || 'ruin',
      importance: (place.importance || 1).toString(),
      longitude: place.longitude,
      latitude: place.latitude,
      cover_image_url: place.cover_image_url,
      certainty: 'high', // Required field based on schema
      // PostgREST supports GeoJSON for geometry insertion
      geom: {
        type: 'Point',
        coordinates: [place.longitude, place.latitude]
      }
    }))

    // Upsert in batches of 100 to avoid request payload limits
    const batchSize = 100
    for (let i = 0; i < formattedPlaces.length; i += batchSize) {
      const batch = formattedPlaces.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('places')
        .upsert(batch, { onConflict: 'id' })

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message)
      } else {
        console.log(`Successfully imported batch ${i / batchSize + 1}`)
      }
    }

    console.log('Import completed!')
  } catch (error) {
    console.error('Failed to import places:', error)
  }
}

importPlaces()
