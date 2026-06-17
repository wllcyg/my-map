import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// 加载环境变量，这里假定脚本从项目根目录运行
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量，请确保 .env.local 存在且配置正确。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 延迟函数，避免请求过快触发维基百科限流拦截
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const USER_AGENT = 'SilkRoadHistoricalMapBot/1.0 (contact@example.com) Node.js';

// 维基百科 API 查询
async function fetchWikipediaData(name: string) {
  try {
    const url = `https://zh.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=1&explaintext=1&titles=${encodeURIComponent(name)}&pithumbsize=800&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    
    const pageIds = Object.keys(pages);
    if (pageIds.length === 0 || pageIds[0] === '-1') return null;
    
    const page = pages[pageIds[0]];
    return {
      description: page.extract,
      imageUrl: page.thumbnail?.source || null
    };
  } catch (error) {
    console.error(`获取 Wikipedia 数据失败 (${name}):`, error);
    return null;
  }
}

// Wikidata API 查询 (提取 P18 图片属性)
async function fetchWikidataImage(wikidataId: string) {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${wikidataId}&property=P18&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    
    const claims = data.claims?.P18;
    if (!claims || claims.length === 0) return null;
    
    const filename = claims[0].mainsnak?.datavalue?.value;
    if (!filename) return null;
    
    // Commons 的文件路径格式
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
  } catch (error) {
    console.error(`获取 Wikidata 图片失败 (${wikidataId}):`, error);
    return null;
  }
}

async function run() {
  console.log('=================================');
  console.log('🚀 开始扫描数据库需要补充的地点...');
  
  // 查找没有图片，或者描述缺失的城市
  // 获取全部待处理地点（设置 1000 足以覆盖几百条数据）
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, description, cover_image_url')
    .or('cover_image_url.is.null,description.eq.null')
    .limit(1000); 

  if (error) {
    console.error('查询数据库失败:', error);
    return;
  }

  if (!places || places.length === 0) {
    console.log('🎉 太棒了，所有数据都已有图文信息，没有需要处理的记录！');
    return;
  }

  const localDataFile = path.resolve(process.cwd(), 'local_enriched_places.json');
  let existingData: any[] = [];
  try {
    const fileContent = await fs.readFile(localDataFile, 'utf-8');
    existingData = JSON.parse(fileContent);
  } catch (e) {
    // ignore
  }
  const existingIds = new Set(existingData.map(item => item.id));

  console.log(`找到 ${places.length} 个需要处理的地点，排除已存在本地的数据，开始抓取...`);

  let successCount = 0;
  const enrichedResults: any[] = [];

  for (const place of places) {
    if (existingIds.has(place.id)) {
      continue; // 跳过已经抓取过并存在本地的数据
    }

    console.log(`\n---------------------------------`);
    console.log(`正在处理: [${place.name}] (ID: ${place.id})`);
    
    let newDescription = place.description;
    let newImageUrl = place.cover_image_url;
    let updated = false;

    // 优先尝试中文维基百科
    const wikiData = await fetchWikipediaData(place.name);
    
    if (wikiData) {
      // 只有在原描述太短或没有时，才使用维基百科描述
      if (wikiData.description && (!newDescription || newDescription.length < 30)) {
        newDescription = wikiData.description;
        updated = true;
        console.log(`✅ 找到维基百科简介 (${newDescription.substring(0, 30)}...)`);
      }
      if (wikiData.imageUrl && !newImageUrl) {
        newImageUrl = wikiData.imageUrl;
        updated = true;
        console.log(`✅ 找到维基百科缩略图`);
      }
    }

    // 如果还没有抓到图片，且 ID 是 Wikidata 标准格式 (如 Q123)，去 Wikidata 单独查
    if (!newImageUrl && /^Q\d+$/.test(place.id)) {
      const wdImageUrl = await fetchWikidataImage(place.id);
      if (wdImageUrl) {
        newImageUrl = wdImageUrl;
        updated = true;
        console.log(`✅ 找到 Wikidata 原始大图`);
      }
    }

    if (updated) {
      enrichedResults.push({
        id: place.id,
        name: place.name,
        description: newDescription,
        cover_image_url: newImageUrl
      });
      console.log(`🟢 成功获取新数据，已暂存到本地！`);
      successCount++;
    } else {
      console.log(`⚠️ 在维基百科未找到更多有价值的信息，跳过。`);
    }

    // 等待 2 秒再请求下一个，更安全地避免被维基百科反爬虫封禁 IP
    await delay(2000);
  }

  if (enrichedResults.length > 0) {
    
    // 更新或追加本地数据
    for (const newItem of enrichedResults) {
      const idx = existingData.findIndex(item => item.id === newItem.id);
      if (idx !== -1) {
        existingData[idx] = newItem;
      } else {
        existingData.push(newItem);
      }
    }
    
    await fs.writeFile(localDataFile, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log(`\n💾 成功将 ${enrichedResults.length} 条更新保存到本地 ${localDataFile}`);
  }

  console.log(`\n=================================`);
  console.log(`✅ 本批次执行完毕！成功丰富了 ${successCount} 个地点的数据。`);
  console.log(`如果还有未填充的数据，你可以再次运行此脚本。`);
}

run();
