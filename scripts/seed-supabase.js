const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' }); // 引入 dotenv 加载环境变量

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 导入数据推荐使用 SERVICE_ROLE_KEY，如果你只有 ANON_KEY 且配置了 RLS 放开写入也可以
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量，请确保 .env.local 存在并配置了 URL 和 KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  const seedPath = path.join(__dirname, '../src/data/seed/silk-road-seed.json');
  const rawData = fs.readFileSync(seedPath, 'utf8');
  const data = JSON.parse(rawData);

  console.log('🚀 开始向 Supabase 导入数据...');

  try {
    // 1. 导入 Periods
    const { error: periodsError } = await supabase.from('periods').upsert(data.periods);
    if (periodsError) throw new Error('Periods 导入失败: ' + periodsError.message);
    console.log('✅ Periods 数据导入成功');

    // 2. 导入 Sources
    const { error: sourcesError } = await supabase.from('sources').upsert(data.sources);
    if (sourcesError) throw new Error('Sources 导入失败: ' + sourcesError.message);
    console.log('✅ Sources 数据导入成功');

    // 3. 导入 Places
    // 需要把 coordinates 分拆为 longitude 和 latitude
    const placesToInsert = data.places.map(p => {
      const { coordinates, ...rest } = p;
      return {
        ...rest,
        longitude: coordinates[0],
        latitude: coordinates[1]
      };
    });
    const { error: placesError } = await supabase.from('places').upsert(placesToInsert);
    if (placesError) throw new Error('Places 导入失败: ' + placesError.message);
    console.log(`✅ Places 数据导入成功 (${placesToInsert.length} 条)`);

    // 4. 导入 Routes
    const { error: routesError } = await supabase.from('routes').upsert(data.routes);
    if (routesError) throw new Error('Routes 导入失败: ' + routesError.message);
    console.log(`✅ Routes 数据导入成功 (${data.routes.length} 条)`);

    console.log('🎉 全部数据导入完毕！');
  } catch (err) {
    console.error('❌ 导入出错:', err.message);
  }
}

seedData();
