import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const localDataFile = path.resolve(process.cwd(), 'local_enriched_places.json');
  let data: any[] = [];
  try {
    const fileContent = await fs.readFile(localDataFile, 'utf-8');
    data = JSON.parse(fileContent);
  } catch (e) {
    console.error('❌ 读取本地 JSON 文件失败', e);
    return;
  }

  console.log(`🚀 准备将 ${data.length} 条数据同步至 Supabase...`);

  let successCount = 0;
  for (const item of data) {
    // 剔除一些明显有问题的重定向描述（比如撒马尔罕的重定向提示）
    if (item.description && item.description.includes('簡繁重定向')) {
      item.description = null;
    }

    const { error } = await supabase
      .from('places')
      .update({
        description: item.description,
        cover_image_url: item.cover_image_url
      })
      .eq('id', item.id);

    if (error) {
      console.error(`❌ 更新失败 [${item.name}]:`, error);
    } else {
      successCount++;
      if (successCount % 20 === 0) {
        console.log(`🟢 已成功同步 ${successCount} 条...`);
      }
    }
  }

  console.log(`🎉 同步完成！成功更新 ${successCount}/${data.length} 条数据。`);
}

run();
