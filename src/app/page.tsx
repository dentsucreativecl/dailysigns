"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Category, NewsItem } from "@/lib/types";
import Link from "next/link";

/* ── Skeleton ── */
function SkeletonHero() {
  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="skeleton" style={{ width: "100%", height: 180, borderRadius: 12, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: "65%", height: 18, borderRadius: 4, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: "90%", height: 12, borderRadius: 4, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: "70%", height: 12, borderRadius: 4, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: "30%", height: 10, borderRadius: 4 }} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: "80%", height: 15, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: "55%", height: 15, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "95%", height: 11, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: "65%", height: 11, borderRadius: 4, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "25%", height: 10, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: 88, height: 88, borderRadius: 10, flexShrink: 0 }} />
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      <SkeletonHero />
      <div style={{ height: 1, background: "var(--separator)" }} />
      <SkeletonRow />
      <div style={{ height: 1, background: "var(--separator)" }} />
      <SkeletonRow />
      <div style={{ height: 1, background: "var(--separator)" }} />
      <SkeletonRow />
    </>
  );
}

/* ── Empty ── */
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center" }}>
      <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
        Sin noticias recientes
      </p>
      <button
        onClick={onRefresh}
        style={{
          fontSize: 13, fontWeight: 600, padding: "10px 24px",
          borderRadius: 9999, background: "var(--accent)", color: "#fff",
          border: "none", cursor: "pointer",
        }}
      >
        Actualizar ahora
      </button>
    </div>
  );
}

/* ── Hero Card ── */
function HeroCard({
  item, color, expanded, onToggle,
}: {
  item: NewsItem; color: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <div onClick={onToggle} className="cursor-pointer" style={{ paddingBottom: 16 }}>
      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt=""
          style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, display: "block", marginBottom: 12 }}
          loading="lazy"
        />
      )}
      <h3 style={{
        fontFamily: "var(--font-headline), serif", fontSize: 20, fontWeight: 400,
        color: "var(--text-primary)", margin: 0, lineHeight: 1.3,
      }}>
        {item.title}
      </h3>
      {!expanded && item.summary && (
        <p className="line-clamp-2" style={{
          fontSize: 13, color: "var(--text-secondary)", marginTop: 8,
          lineHeight: 1.4,
        }}>
          {item.summary}
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{item.source}</span>
        {item.time_ago && (
          <>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>•</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.time_ago}</span>
          </>
        )}
      </div>

      {/* Expanded */}
      <div style={{
        maxHeight: expanded ? 800 : 0, opacity: expanded ? 1 : 0,
        overflow: "hidden", transition: "max-height 0.3s ease, opacity 0.2s ease",
        marginTop: expanded ? 16 : 0,
      }}>
        <div style={{ height: 1, background: "var(--separator)", marginBottom: 16 }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
          {item.source}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
          {item.summary}
        </p>
        {item.relevance && (
          <p style={{
            display: "inline-block", fontSize: 12, fontWeight: 500,
            padding: "4px 12px", borderRadius: 9999,
            backgroundColor: color + "1A", color, marginBottom: 16,
          }}>
            → Por qué importa: {item.relevance}
          </p>
        )}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 500, color: "#fff", background: "var(--accent)",
              height: 48, borderRadius: 9999, textDecoration: "none", width: "100%",
            }}
          >
            Leer Noticia
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Article Row ── */
function ArticleRow({
  item, color, expanded, onToggle, isLast,
}: {
  item: NewsItem; color: string; expanded: boolean; onToggle: () => void; isLast: boolean;
}) {
  return (
    <>
      <div onClick={onToggle} className="cursor-pointer" style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="line-clamp-2" style={{
              fontFamily: "var(--font-headline), serif", fontSize: 17, fontWeight: 400,
              lineHeight: 1.3, color: "var(--text-primary)", margin: 0,
            }}>
              {item.title}
            </h3>
            {!expanded && item.summary && (
              <p className="line-clamp-2" style={{
                fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.4,
              }}>
                {item.summary}
              </p>
            )}
            <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", marginTop: 6 }}>
              {item.source}{item.time_ago && ` • ${item.time_ago}`}
            </p>
          </div>
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt=""
              style={{ width: 88, height: 88, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
              loading="lazy"
            />
          )}
        </div>

        {/* Expanded */}
        <div style={{
          maxHeight: expanded ? 800 : 0, opacity: expanded ? 1 : 0,
          overflow: "hidden", transition: "max-height 0.3s ease, opacity 0.2s ease",
          marginTop: expanded ? 16 : 0,
        }}>
          <div style={{ height: 1, background: "var(--separator)", marginBottom: 16 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
            {item.source}
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
            {item.summary}
          </p>
          {item.relevance && (
            <p style={{
              display: "inline-block", fontSize: 12, fontWeight: 500,
              padding: "4px 12px", borderRadius: 9999,
              backgroundColor: color + "1A", color, marginBottom: 16,
            }}>
              → Por qué importa: {item.relevance}
            </p>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 500, color: "#fff", background: "var(--accent)",
                height: 48, borderRadius: 9999, textDecoration: "none", width: "100%",
              }}
            >
              Leer Noticia
            </a>
          )}
        </div>
      </div>
      {!isLast && <div style={{ height: 1, background: "var(--separator)" }} />}
    </>
  );
}

/* ── Main Page ── */
export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newsByCategory, setNewsByCategory] = useState<Record<string, NewsItem[]>>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const CACHE_HOURS = 4;

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: cats } = await supabase
      .from("categories").select("*").eq("active", true).order("created_at");
    if (!cats || cats.length === 0) { setLoading(false); return; }
    setCategories(cats);
    if (!activeTab) setActiveTab(cats[0].id);
    const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cachedNews } = await supabase
      .from("news_items").select("*").gte("fetched_at", cutoff).order("fetched_at", { ascending: false });
    if (cachedNews && cachedNews.length > 0) {
      const grouped: Record<string, NewsItem[]> = {};
      for (const item of cachedNews) {
        if (!grouped[item.category_id]) grouped[item.category_id] = [];
        grouped[item.category_id].push(item);
      }
      setNewsByCategory(grouped);
      setLoading(false);
    } else { setLoading(false); handleRefresh(); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true); setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);
      const res = await fetch("/api/refresh", { method: "POST", signal: controller.signal });
      clearTimeout(timeout);
      const body = await res.json();
      if (!res.ok || body.success === false) {
        setError(body.error === "rate_limit"
          ? `Límite alcanzado. Intenta en ${body.retry_after || "unos minutos"}.`
          : body.error || `Error (${res.status})`);
        setRefreshing(false); return;
      }
      const { data: freshNews } = await supabase
        .from("news_items").select("*").order("fetched_at", { ascending: false });
      if (freshNews) {
        const grouped: Record<string, NewsItem[]> = {};
        for (const item of freshNews) {
          if (!grouped[item.category_id]) grouped[item.category_id] = [];
          grouped[item.category_id].push(item);
        }
        setNewsByCategory(grouped);
      }
    } catch (e: unknown) {
      setError(e instanceof DOMException && e.name === "AbortError"
        ? "Timeout: la actualización tardó demasiado" : "Error de red al actualizar");
    }
    setRefreshing(false);
  };

  const switchTab = (id: string) => {
    setActiveTab(id); setExpandedId(null);
    feedRef.current?.scrollTo({ top: 0 });
  };

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const activeCategory = categories.find((c) => c.id === activeTab);
  const currentNews = newsByCategory[activeTab] || [];
  const firstItem = currentNews[0];
  const restItems = currentNews.slice(1);

  return (
    <div className="h-dvh flex flex-col" style={{ background: "var(--bg-page)", maxWidth: 430, margin: "0 auto" }}>
      {/* ── Header ── */}
      <header className="flex-shrink-0" style={{ padding: "12px 16px 0", zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-title), sans-serif", fontSize: 28, fontWeight: 400,
              color: "var(--text-primary)", margin: 0, lineHeight: 1.2,
            }}>
              DailySigns
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{today}</p>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                width: 40, height: 40, borderRadius: 20,
                background: "var(--surface)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "var(--text-primary)",
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>
            </button>
            <Link href="/admin" style={{
              width: 40, height: 40, borderRadius: 20,
              background: "var(--surface)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "var(--text-primary)", textDecoration: "none",
            }}>
              ⚙
            </Link>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <nav className="flex-shrink-0" style={{ padding: "16px 16px 0", zIndex: 49 }}>
        <div className="flex overflow-x-auto hide-scrollbar" style={{ gap: 8, height: 36 }}>
          {categories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => switchTab(cat.id)}
                style={{
                  flexShrink: 0, height: "100%",
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  padding: "0 16px", borderRadius: 18,
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                  border: isActive ? "none" : "1px solid var(--separator)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Section Header ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 16px 8px",
      }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: "var(--text-secondary)",
          letterSpacing: 0.8, textTransform: "uppercase",
        }}>
          ★ ÚLTIMAS NOTICIAS
        </span>
      </div>

      {/* ── Error toast ── */}
      {error && (
        <div className="flex-shrink-0" style={{
          margin: "0 16px 8px", padding: "10px 16px",
          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <p style={{ fontSize: 13, color: "#B91C1C" }}>{error}</p>
          <button onClick={() => setError(null)} style={{
            color: "#F87171", fontSize: 18, lineHeight: 1, marginLeft: 12,
            background: "none", border: "none", cursor: "pointer",
          }}>×</button>
        </div>
      )}

      {/* ── Feed ── */}
      <div ref={feedRef} className="flex-1 overflow-y-auto" style={{ padding: "0 16px 80px" }}>
        {loading || (refreshing && currentNews.length === 0) ? (
          <SkeletonList />
        ) : currentNews.length > 0 ? (
          <>
            {/* Hero */}
            {firstItem && firstItem.image_url ? (
              <>
                <HeroCard
                  item={firstItem}
                  color={activeCategory?.color || "#333"}
                  expanded={expandedId === firstItem.id}
                  onToggle={() => setExpandedId(expandedId === firstItem.id ? null : firstItem.id)}
                />
                {restItems.length > 0 && <div style={{ height: 1, background: "var(--separator)" }} />}
              </>
            ) : firstItem ? (
              <ArticleRow
                item={firstItem}
                color={activeCategory?.color || "#333"}
                expanded={expandedId === firstItem.id}
                onToggle={() => setExpandedId(expandedId === firstItem.id ? null : firstItem.id)}
                isLast={restItems.length === 0}
              />
            ) : null}

            {/* Rest */}
            {restItems.map((item, i) => (
              <ArticleRow
                key={item.id}
                item={item}
                color={activeCategory?.color || "#333"}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                isLast={i === restItems.length - 1}
              />
            ))}
          </>
        ) : (
          <EmptyState onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
}
