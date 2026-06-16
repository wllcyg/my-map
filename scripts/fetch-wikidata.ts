import fs from 'fs/promises'
import path from 'path'

// Wikidata SPARQL endpoint
const ENDPOINT = 'https://query.wikidata.org/sparql'

// SPARQL query to find places that are part of the Silk Roads: the Routes Network of Chang'an-Tianshan Corridor (Q16056345)
// or generally tagged with Silk Road (Q36288) related properties.
// For demonstration, we'll fetch UNESCO sites of the Chang'an-Tianshan Corridor.
const QUERY = `
SELECT ?place ?placeLabel ?placeDescription ?coord ?image
WHERE {
  # Look for historical cities (Q4345638) or archaeological sites (Q839954)
  VALUES ?type { wd:Q4345638 wd:Q839954 }
  ?place wdt:P31 ?type .
  
  # Located in country (China, Uzbekistan, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Iran)
  # This avoids the expensive recursive P131* search which causes 504 timeouts
  VALUES ?country { wd:Q148 wd:Q265 wd:Q232 wd:Q813 wd:Q863 wd:Q874 wd:Q794 }
  ?place wdt:P17 ?country .

  ?place wdt:P625 ?coord .
  OPTIONAL { ?place wdt:P18 ?image . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "zh,en". }
}
LIMIT 500
`

async function fetchWikidata() {
  console.log('Fetching data from Wikidata...')
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'SilkRoadMapDataEnrichmentBot/1.0'
      },
      body: new URLSearchParams({ query: QUERY })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const results = data.results.bindings

    console.log(`Found ${results.length} places.`)

    const formattedData = results.map((item: any) => {
      // Extract longitude and latitude from Point(lon lat) format
      const coordString = item.coord.value
      const match = coordString.match(/Point\(([-\d.]+) ([-\d.]+)\)/)
      let longitude = 0
      let latitude = 0
      if (match) {
        longitude = parseFloat(match[1])
        latitude = parseFloat(match[2])
      }

      return {
        wikidata_id: item.place.value.split('/').pop(),
        name: item.placeLabel.value,
        description: item.placeDescription?.value || '',
        longitude,
        latitude,
        cover_image_url: item.image?.value || null
      }
    })

    // Deduplicate by wikidata_id to fix the Cartesian product issue from SPARQL
    const uniqueDataMap = new Map()
    for (const item of formattedData) {
      if (!uniqueDataMap.has(item.wikidata_id)) {
        uniqueDataMap.set(item.wikidata_id, item)
      }
    }
    const uniqueData = Array.from(uniqueDataMap.values())

    console.log(`Deduplicated from ${formattedData.length} raw rows to ${uniqueData.length} unique places.`)

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data')
    await fs.mkdir(dataDir, { recursive: true })

    const outputPath = path.join(dataDir, 'wikidata-places.json')
    await fs.writeFile(outputPath, JSON.stringify(uniqueData, null, 2), 'utf-8')

    console.log(`Successfully saved data to ${outputPath}`)
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

fetchWikidata()
