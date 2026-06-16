import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  console.log('=== STARTING DATA DIAGNOSTIC ===\n')

  // 1. Diagnose places
  const { data: places, error: placesError } = await supabase.from('places').select('*')
  if (placesError) {
    console.error('Error fetching places:', placesError)
    return
  }

  console.log(`Total places in database: ${places.length}`)

  let nullPeriods = 0
  let emptyPeriods = 0
  let invalidCoords = 0
  let suspiciousCoords = 0 // e.g. close to 0,0 or in wrong hemisphere
  let missingImagesImportant = 0
  let invalidTypes = 0

  const validTypes = ['metropolis', 'oasis', 'checkpoint', 'ruin', 'port']

  for (const p of places) {
    // Check periods
    if (!p.periods) {
      nullPeriods++
    } else if (p.periods.length === 0) {
      emptyPeriods++
    }

    // Check coordinates validity
    if (typeof p.longitude !== 'number' || typeof p.latitude !== 'number') {
      invalidCoords++
    } else {
      // Silk Road is in the Eastern Hemisphere, Northern Hemisphere mostly (lat 0 to 60, lon 0 to 140)
      // Except for Rome/Venice (lat ~40-45, lon ~12) and East Africa (Mogadishu, lat ~2, lon ~45)
      // Let's flag any coordinates that are 0 or wildly off
      if (p.longitude === 0 && p.latitude === 0) {
        suspiciousCoords++
        console.log(`[Suspicious Coord] Place "${p.name}" (ID: ${p.id}) is at (0, 0)`)
      } else if (p.longitude < -20 || p.longitude > 160 || p.latitude < -10 || p.latitude > 70) {
        suspiciousCoords++
        console.log(`[Suspicious Coord] Place "${p.name}" (ID: ${p.id}) is at (${p.longitude}, ${p.latitude}) which is outside Silk Road range`)
      }
    }

    // Check types
    if (!validTypes.includes(p.type)) {
      invalidTypes++
      console.log(`[Invalid Type] Place "${p.name}" (ID: ${p.id}) has invalid type "${p.type}"`)
    }

    // Check cover images on important nodes
    const importanceNum = parseInt(p.importance)
    if (importanceNum >= 4 && !p.cover_image_url) {
      missingImagesImportant++
      console.log(`[Missing Image] Important place "${p.name}" (importance: ${p.importance}, type: ${p.type}) lacks a cover image.`)
    }
  }

  console.log('\n--- PLACES SUMMARY ---')
  console.log(`Places with null periods: ${nullPeriods}`)
  console.log(`Places with empty periods: ${emptyPeriods}`)
  console.log(`Places with invalid coordinates: ${invalidCoords}`)
  console.log(`Places with suspicious/out-of-bounds coordinates: ${suspiciousCoords}`)
  console.log(`Places with invalid type values: ${invalidTypes}`)
  console.log(`Important places (>= 4) missing cover images: ${missingImagesImportant}`)

  // 2. Diagnose routes
  const { data: routes, error: routesError } = await supabase.from('routes').select('*')
  if (routesError) {
    console.error('Error fetching routes:', routesError)
    return
  }

  console.log('\n--- ROUTES SUMMARY ---')
  console.log(`Total routes in database: ${routes.length}`)
  
  for (const r of routes) {
    console.log(`\nRoute: "${r.name}" (ID: ${r.id})`)
    const coords = r.coordinates
    if (!coords || !Array.isArray(coords)) {
      console.log(`- ERROR: Coordinates is not an array or is null`)
      continue
    }
    console.log(`- Point count: ${coords.length}`)
    if (coords.length > 0) {
      console.log(`- Start point: [${coords[0][0]}, ${coords[0][1]}]`)
      console.log(`- End point: [${coords[coords.length - 1][0]}, ${coords[coords.length - 1][1]}]`)
      
      // Look for huge coordinate jumps (indicating OSRM route warping or weird geometries)
      let maxDistance = 0
      let jumpIndex = -1
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i]
        const p2 = coords[i + 1]
        const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2))
        if (dist > maxDistance) {
          maxDistance = dist
          jumpIndex = i
        }
      }
      console.log(`- Maximum step distance in degrees: ${maxDistance.toFixed(4)}`)
      if (maxDistance > 10) {
        console.log(`- WARNING: Large jump of ${maxDistance.toFixed(2)} degrees at point index ${jumpIndex}!`)
        console.log(`  From [${coords[jumpIndex][0]}, ${coords[jumpIndex][1]}] to [${coords[jumpIndex + 1][0]}, ${coords[jumpIndex + 1][1]}]`)
      }
    }
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===')
}

diagnose()
