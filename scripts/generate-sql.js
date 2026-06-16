const fs = require('fs');
const path = require('path');
const data = require('../src/data/seed/silk-road-seed.json');

let sql = '';

// Helper to escape single quotes
const escapeSql = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
};

// Helper for arrays
const escapeArray = (arr) => {
  if (!arr || arr.length === 0) return 'ARRAY[]::TEXT[]';
  return 'ARRAY[' + arr.map(escapeSql).join(', ') + ']::TEXT[]';
};

// Helper for json
const escapeJson = (obj) => {
  if (!obj) return 'NULL';
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
};

// 1. Periods
sql += '-- Insert Periods\n';
for (const p of data.periods) {
  sql += `INSERT INTO periods (id, name, range, description) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.range)}, ${escapeSql(p.description)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 2. Sources
sql += '-- Insert Sources\n';
for (const s of data.sources) {
  sql += `INSERT INTO sources (id, title, author, url, description) VALUES (${escapeSql(s.id)}, ${escapeSql(s.title)}, ${escapeSql(s.author)}, ${escapeSql(s.url)}, ${escapeSql(s.description)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 3. Places
sql += '-- Insert Places\n';
for (const p of data.places) {
  const lon = p.coordinates[0];
  const lat = p.coordinates[1];
  sql += `INSERT INTO places (id, name, aliases, description, type, importance, longitude, latitude, periods, period_notes, certainty, related_place_ids, source_ids) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeArray(p.aliases)}, ${escapeSql(p.description)}, ${escapeSql(p.type)}, ${escapeSql(p.importance)}, ${lon}, ${lat}, ${escapeArray(p.periods)}, ${escapeJson(p.period_notes)}, ${escapeSql(p.certainty)}, ${escapeArray(p.related_place_ids)}, ${escapeArray(p.source_ids)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// 4. Routes
sql += '-- Insert Routes\n';
for (const r of data.routes) {
  sql += `INSERT INTO routes (id, name, type, periods, description, coordinates, source_ids) VALUES (${escapeSql(r.id)}, ${escapeSql(r.name)}, ${escapeSql(r.type)}, ${escapeArray(r.periods)}, ${escapeSql(r.description)}, ${escapeJson(r.coordinates)}, ${escapeArray(r.source_ids)}) ON CONFLICT (id) DO NOTHING;\n`;
}

fs.writeFileSync(path.join(__dirname, 'supabase-seed-data.sql'), sql);
console.log('✅ 成功生成 supabase-seed-data.sql 文件！');
