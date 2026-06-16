import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase URL 或 Anon Key 缺失。请在 .env.local 中配置。");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
