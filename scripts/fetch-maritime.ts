
import fs from 'fs/promises'
import path from 'path'

const MARITIME_PORTS = [
  'wd:Q68695',  // 泉州 (Quanzhou)
  'wd:Q16572',  // 广州 (Guangzhou)
  'wd:Q42780',  // 宁波 (Ningbo)
  'wd:Q68481',  // 福州 (Fuzhou)
  'wd:Q8131',   // 巨港/三佛齐 (Palembang)
  'wd:Q61089',  // 马六甲 (Malacca)
  'wd:Q321475', // 奎隆 (Kollam)
  'wd:Q28729',  // 卡利卡特 (Calicut)
  'wd:Q35381',  // 科伦坡 (Colombo)
  'wd:Q4629',   // 苏拉特 (Surat)
  'wd:Q168056', // 尸罗夫 (Siraf)
  'wd:Q888643', // 霍尔木兹 (Hormuz)
  'wd:Q48195',  // 巴士拉 (Basra)
  'wd:Q3826',   // 马斯喀特 (Muscat)
  'wd:Q131694', // 亚丁 (Aden)
  'wd:Q374365', // 吉达 (Jeddah)
  'wd:Q2449',   // 摩加迪沙 (Mogadishu)
  'wd:Q87',     // 亚历山大港 (Alexandria)
  'wd:Q220',    // 罗马 (Rome)
  'wd:Q641',    // 威尼斯 (Venice)
  'wd:Q1449'    // 热那亚 (Genoa)
];

const SPARQL_QUERY = `
SELECT ?place ?placeLabel ?placeDescription ?coord ?image
WHERE {
  VALUES ?place { ${MARITIME_PORTS.join(' ')} }
  OPTIONAL { ?place wdt:P625 ?coord. }
  OPTIONAL { ?place wdt:P18 ?image. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "zh,en". }
}
`;

const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql'

async function fetchMaritimePlaces() {
  console.log('Fetching Maritime Silk Road data from Wikidata...')
  
  try {
    const response = await fetch(
      `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(SPARQL_QUERY)}`,
      {
        headers: {
          'Accept': 'application/sparql-results+json',
          'User-Agent': 'SilkRoadMapProject/1.0 (Contact: user@example.com)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: any = await response.json()
    const results = data.results.bindings

    console.log(`Found ${results.length} ports.`)

    const placesMap = new Map()

    for (const item of results) {
      const id = item.place.value.split('/').pop()
      
      if (placesMap.has(id)) continue

      let longitude = null
      let latitude = null
      if (item.coord) {
        const match = item.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/)
        if (match) {
          longitude = parseFloat(match[1])
          latitude = parseFloat(match[2])
        }
      }

      // Ignore places without coordinates
      if (longitude === null || latitude === null) continue

      placesMap.set(id, {
        wikidata_id: id,
        name: item.placeLabel.value,
        description: item.placeDescription ? item.placeDescription.value : 'A historical maritime port.',
        longitude,
        latitude,
        cover_image_url: item.image ? item.image.value : null
      })
    }

    const uniquePlaces = Array.from(placesMap.values())
    console.log(`Successfully parsed ${uniquePlaces.length} unique maritime ports.`)

    const outputPath = path.join(process.cwd(), 'data', 'maritime-places.json')
    await fs.writeFile(outputPath, JSON.stringify(uniquePlaces, null, 2), 'utf-8')
    console.log(`Successfully saved data to ${outputPath}`)

  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

fetchMaritimePlaces()
