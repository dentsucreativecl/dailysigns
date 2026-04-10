import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { XMLParser } from "fast-xml-parser";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

interface RSSArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image: string;
}

interface CategoryWithFeeds {
  id: string;
  label: string;
  query: string;
  color: string;
  active: boolean;
  rss_feeds: string[] | null;
}

interface ArticleFromAI {
  title: string;
  summary: string;
  source: string;
  relevance: string;
  time_ago: string;
  url: string;
  image_url?: string;
}

function extractImage(item: Record<string, unknown>): string {
  const media = item["media:content"] as Record<string, string> | undefined;
  if (media?.["@_url"]) return media["@_url"];

  const thumb = item["media:thumbnail"] as Record<string, string> | undefined;
  if (thumb?.["@_url"]) return thumb["@_url"];

  const enclosure = item.enclosure as Record<string, string> | undefined;
  if (enclosure?.["@_url"] && enclosure["@_type"]?.startsWith("image/"))
    return enclosure["@_url"];
  if (enclosure?.["@_url"] && /\.(jpg|jpeg|png|webp)/i.test(enclosure["@_url"]))
    return enclosure["@_url"];

  const image = item.image as string | Record<string, string> | undefined;
  if (typeof image === "string" && image.startsWith("http")) return image;
  if (typeof image === "object" && image?.url) return image.url;

  const html = String(item["content:encoded"] || item.description || "");
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch?.[1]) return imgMatch[1];

  return "";
}

async function fetchRSSFeed(url: string): Promise<RSSArticle[]> {
  console.log(`[RSS] Fetching: ${url}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DC-Signal/1.0" },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.log(`[RSS] ${url}: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);

    // Handle RSS 2.0
    const channel = parsed?.rss?.channel;
    if (channel?.item) {
      const items = Array.isArray(channel.item)
        ? channel.item
        : [channel.item];
      const result = items.slice(0, 5).map((item: Record<string, unknown>) => {
        let link = "";
        if (typeof item.link === "string") {
          link = item.link;
        } else if (typeof item.link === "object" && item.link !== null) {
          const l = item.link as Record<string, string>;
          link = l["#text"] || l["@_href"] || "";
        }
        return {
          title: String(item.title || "").slice(0, 120),
          description: String(item.description || "")
            .replace(/<[^>]*>/g, "")
            .slice(0, 150),
          link,
          pubDate: String(item.pubDate || ""),
          image: extractImage(item),
        };
      });
      console.log(`[RSS] ${url}: OK, ${result.length} items`);
      return result;
    }

    // Handle Atom
    const feed = parsed?.feed;
    if (feed?.entry) {
      const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
      const result = entries.slice(0, 5).map((entry: Record<string, unknown>) => {
        let link = "";
        if (typeof entry.link === "string") {
          link = entry.link;
        } else if (Array.isArray(entry.link)) {
          const alt = (entry.link as Record<string, string>[]).find(
            (l) => l["@_rel"] === "alternate" || !l["@_rel"]
          );
          link = alt?.["@_href"] || (entry.link[0] as Record<string, string>)["@_href"] || "";
        } else if (typeof entry.link === "object" && entry.link !== null) {
          link = (entry.link as Record<string, string>)["@_href"] || "";
        }
        return {
          title: String(entry.title || "").slice(0, 120),
          description: String(entry.summary || "")
            .replace(/<[^>]*>/g, "")
            .slice(0, 150),
          link,
          pubDate: String(entry.published || entry.updated || ""),
          image: extractImage(entry),
        };
      });
      console.log(`[RSS] ${url}: OK (Atom), ${result.length} items`);
      return result;
    }

    console.log(`[RSS] ${url}: No items found in feed`);
    return [];
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[RSS] ${url}: ERROR - ${msg}`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNewsForCategory(
  category: CategoryWithFeeds
): Promise<ArticleFromAI[]> {
  const feeds = category.rss_feeds || [];
  console.log(`[Cat] Procesando: ${category.label}`);
  console.log(`[Cat] Feeds: ${feeds.join(", ") || "(ninguno)"}`);

  if (feeds.length === 0) {
    console.log(`[Cat] ${category.label}: Sin feeds, saltando`);
    return [];
  }

  const allRaw = (await Promise.all(feeds.map(fetchRSSFeed))).flat();
  // Cap at 15 items max to stay within Groq token limits (6k TPM on 8b model)
  const allArticles = allRaw.slice(0, 15);
  console.log(`[Cat] ${category.label}: ${allRaw.length} items de RSS, usando ${allArticles.length}`);

  if (allArticles.length === 0) {
    console.log(`[Cat] ${category.label}: 0 items, saltando Groq`);
    return [];
  }

  const imageMap = new Map<string, string>();
  for (const a of allRaw) {
    if (a.image && a.link) imageMap.set(a.link, a.image);
  }

  const articlesText = allArticles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title}\n${a.description}\nLink: ${a.link}\nDate: ${a.pubDate}`
    )
    .join("\n\n");

  const systemPrompt =
    "Eres un editor de noticias para un CEO de agencia creativa en Chile.\nRecibirás artículos recientes en inglés o español.\nSelecciona entre 6 y 8 de los más relevantes.\nDevuelve SOLO JSON sin markdown:\n{\"articles\": [{\"title\", \"summary\", \"source\", \"relevance\", \"time_ago\", \"url\"}]}\n- title: en español, máximo 80 caracteres\n- summary: 2-3 líneas en español, directo\n- source: nombre del medio\n- relevance: por qué importa para un CEO de agencia creativa en Chile, 1 línea\n- time_ago: tiempo relativo en español (ej: 'hace 2h', 'hace 1 día')\n- url: link original del artículo (DEBE ser la URL exacta del Link proporcionado, no la inventes)";

  const userContent = `Categoría: ${category.label}\n\nArtículos:\n${articlesText}`;

  // Helper to parse articles JSON from any LLM response text
  function parseArticlesFromText(text: string): ArticleFromAI[] | null {
    const jsonMatch = text.match(/\{[\s\S]*"articles"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed.articles || []) as ArticleFromAI[];
      } catch { /* invalid JSON */ }
    }
    return null;
  }

  // Attempt 1: Groq llama-3.1-8b-instant
  console.log(`[Groq] Llamando llama-3.1-8b-instant para: ${category.label}...`);
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    const text = response.choices[0]?.message?.content || "";
    console.log(`[Groq] ${category.label} respondió: ${text.slice(0, 300)}`);
    const articles = parseArticlesFromText(text);
    if (articles) {
      console.log(`[Groq] ${category.label}: ${articles.length} artículos parseados`);
      return articles.map((a) => ({ ...a, image_url: imageMap.get(a.url) || "" }));
    }
    console.log(`[Groq] ${category.label}: No se encontró JSON válido`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const isRateLimit = msg.includes("429") || msg.includes("rate_limit");
    console.error(`[Groq] ERROR ${category.label}: ${msg}`);

    if (isRateLimit) {
      // Attempt 2: Wait 2s and retry Groq
      console.log(`[Groq] Rate limit — esperando 2s y reintentando...`);
      await new Promise((r) => setTimeout(r, 2000));

      try {
        const response2 = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
        });
        const text2 = response2.choices[0]?.message?.content || "";
        console.log(`[Groq] ${category.label} retry respondió: ${text2.slice(0, 300)}`);
        const articles2 = parseArticlesFromText(text2);
        if (articles2) {
          console.log(`[Groq] ${category.label}: ${articles2.length} artículos parseados (retry)`);
          return articles2.map((a) => ({ ...a, image_url: imageMap.get(a.url) || "" }));
        }
      } catch (e2: unknown) {
        const msg2 = e2 instanceof Error ? e2.message : String(e2);
        console.error(`[Groq] Retry ERROR ${category.label}: ${msg2}`);
      }

      // Attempt 3: Gemini Flash 2.0
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        console.log(`[Gemini] Groq rate limited — usando Gemini Flash para ${category.label}`);
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: `${systemPrompt}\n\n${userContent}` },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 4096,
                },
              }),
            }
          );
          const geminiData = await geminiRes.json();
          const geminiText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          console.log(`[Gemini] ${category.label} respondió: ${geminiText.slice(0, 300)}`);
          const articles3 = parseArticlesFromText(geminiText);
          if (articles3) {
            console.log(`[Gemini] ${category.label}: ${articles3.length} artículos parseados`);
            return articles3.map((a) => ({ ...a, image_url: imageMap.get(a.url) || "" }));
          }
          console.log(`[Gemini] ${category.label}: No se encontró JSON válido`);
        } catch (e3: unknown) {
          const msg3 = e3 instanceof Error ? e3.message : String(e3);
          console.error(`[Gemini] ERROR ${category.label}: ${msg3}`);
        }
      } else {
        console.log(`[Gemini] GEMINI_API_KEY no configurada, saltando fallback`);
      }
    }
  }

  console.log(`[Cat] ${category.label}: todos los providers fallaron, continuando sin artículos`);
  return [];
}

export async function POST() {
  console.log("\n========== REFRESH INICIADO ==========");
  try {
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true);

    if (catError) {
      console.error("[DB] Error cargando categorías:", catError.message);
      throw catError;
    }

    console.log(`[DB] Categorías activas: ${categories?.length || 0}`);

    if (!categories || categories.length === 0) {
      console.log("[DB] No hay categorías activas");
      return NextResponse.json({ success: true, message: "No active categories" });
    }

    const categoryIds = categories.map((c: CategoryWithFeeds) => c.id);
    const { error: delError } = await supabase
      .from("news_items")
      .delete()
      .in("category_id", categoryIds);

    if (delError) {
      console.error("[DB] Error borrando news antiguas:", delError.message);
    } else {
      console.log("[DB] News antiguas borradas OK");
    }

    // Process categories sequentially to avoid overwhelming Groq
    const results: unknown[][] = [];
    for (const category of categories as CategoryWithFeeds[]) {
      try {
        const articles = await fetchNewsForCategory(category);
        if (articles.length === 0) {
          console.log(`[DB] ${category.label}: 0 artículos, nada que guardar`);
          results.push([]);
          continue;
        }

        const rows = articles.map((a: ArticleFromAI) => ({
          category_id: category.id,
          category_label: category.label,
          title: a.title?.slice(0, 80) || "Sin título",
          summary: a.summary || "",
          source: a.source || "Fuente desconocida",
          relevance: a.relevance || null,
          time_ago: a.time_ago || null,
          url: a.url || null,
          image_url: a.image_url || null,
        }));

        console.log(`[DB] Guardando ${rows.length} artículos para ${category.label}...`);
        const { data, error } = await supabase
          .from("news_items")
          .insert(rows)
          .select();

        if (error) {
          console.error(`[DB] Error insert ${category.label}: ${error.message}`);
          results.push([]);
        } else {
          console.log(`[DB] ${category.label}: ${data?.length || 0} guardados OK`);
          results.push(data || []);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[Cat] Error procesando ${category.label}: ${msg}`);
        results.push([]);
      }
    }

    // Group results by category
    const grouped: Record<string, unknown[]> = {};
    for (const category of categories) {
      grouped[category.label] = [];
    }
    for (const items of results) {
      for (const item of items as Record<string, string>[]) {
        if (!grouped[item.category_label]) {
          grouped[item.category_label] = [];
        }
        grouped[item.category_label].push(item);
      }
    }

    const totalArticles = results.reduce((sum, r) => sum + r.length, 0);
    console.log(`========== REFRESH COMPLETADO: ${totalArticles} artículos ==========\n`);

    return NextResponse.json({ success: true, categories: grouped });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`========== REFRESH ERROR: ${errMsg} ==========\n`);
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
