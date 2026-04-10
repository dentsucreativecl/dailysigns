import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Test Supabase connection
  let supabaseStatus = "no URL configured";
  let categories: unknown[] = [];
  if (supabaseUrl) {
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      supabaseStatus = `Error: ${error.message}`;
    } else {
      supabaseStatus = `OK - ${data?.length || 0} categories found`;
      categories = data || [];
    }
  }

  return NextResponse.json({
    supabase_url: supabaseUrl ? "set" : "missing",
    supabase_status: supabaseStatus,
    categories,
    anthropic_key: anthropicKey ? `set (${anthropicKey.slice(0, 12)}...)` : "MISSING",
  });
}
