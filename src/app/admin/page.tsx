"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";
import Link from "next/link";

const COLOR_PRESETS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6",
  "#EC4899", "#EF4444", "#06B6D4",
];

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0]);

  const [editing, setEditing] = useState<Category | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editQuery, setEditQuery] = useState("");
  const [editColor, setEditColor] = useState("");

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories").select("*").order("created_at");
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => { loadCategories(); }, []);

  const toggleActive = async (cat: Category) => {
    await supabase.from("categories").update({ active: !cat.active }).eq("id", cat.id);
    loadCategories();
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEditLabel(cat.label);
    setEditQuery(cat.query);
    setEditColor(cat.color);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from("categories")
      .update({ label: editLabel, query: editQuery, color: editColor })
      .eq("id", editing.id);
    setEditing(null);
    loadCategories();
  };

  const addCategory = async () => {
    if (!newLabel.trim() || !newQuery.trim()) return;
    await supabase.from("categories").insert({ label: newLabel, query: newQuery, color: newColor });
    setNewLabel(""); setNewQuery(""); setNewColor(COLOR_PRESETS[0]);
    loadCategories();
  };

  const saveAndRefresh = async () => {
    setSaving(true);
    try { await fetch("/api/refresh", { method: "POST" }); } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
        Cargando...
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, padding: "8px 16px",
    borderRadius: 9999, border: "1px solid var(--separator)",
    fontSize: 14, color: "var(--text-primary)", background: "#fff",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: 24 }}>←</Link>
          <h1 style={{
            fontFamily: "var(--font-headline), serif", fontSize: 22, fontWeight: 400,
            color: "var(--text-primary)", margin: 0,
          }}>
            Categorías
          </h1>
        </div>
        <Link href="/" style={{ fontSize: 16, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
          Listo
        </Link>
      </header>

      <main style={{ padding: "16px 20px 24px" }}>
        {/* Section label */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: 1, marginBottom: 12 }}>
          TUS CATEGORÍAS
        </p>

        {/* Category list */}
        <div style={{ borderRadius: 12, border: "1px solid var(--separator)", overflow: "hidden", marginBottom: 24 }}>
          {categories.map((cat, i) => (
            <div key={cat.id}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                height: 52, padding: "0 16px",
              }}>
                {/* Color dot */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                {/* Name */}
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
                  {cat.label}
                </span>
                {/* Edit */}
                <button
                  onClick={() => openEdit(cat)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-secondary)", fontSize: 18 }}
                >
                  ✎
                </button>
                {/* Toggle */}
                <button
                  onClick={() => toggleActive(cat)}
                  style={{
                    position: "relative", width: 44, height: 24,
                    borderRadius: 12, border: "none", cursor: "pointer",
                    background: cat.active ? "var(--accent)" : "#D1D5DB",
                    transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2,
                    left: cat.active ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>
              {i < categories.length - 1 && (
                <div style={{ height: 1, background: "var(--separator)", marginLeft: 16 }} />
              )}
            </div>
          ))}
        </div>

        {/* Add new category */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: 1, marginBottom: 12 }}>
          AGREGAR NUEVA CATEGORÍA
        </p>

        <div style={{
          borderRadius: 12, border: "1px solid var(--separator)",
          padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Nombre</label>
            <input
              type="text"
              placeholder="ej. Inteligencia Artificial"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Query */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Query de búsqueda</label>
            <input
              type="text"
              placeholder="ej. IA, machine learning, GPT"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Color */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Color</label>
            <div style={{ display: "flex", gap: 10 }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: c, border: newColor === c ? "2px solid var(--text-primary)" : "none",
                    cursor: "pointer", padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Add button */}
          <button
            onClick={addCategory}
            style={{
              width: "100%", height: 44, borderRadius: 9999,
              background: "var(--text-primary)", color: "#fff",
              fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
            }}
          >
            Agregar categoría
          </button>
        </div>

        {/* Save & Update */}
        <button
          onClick={saveAndRefresh}
          disabled={saving}
          style={{
            width: "100%", height: 48, borderRadius: 9999,
            background: "var(--accent)", color: "#fff",
            fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Actualizando..." : "💾 Guardar y actualizar"}
        </button>
      </main>

      {/* Edit modal */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 20,
            width: "100%", maxWidth: 360,
          }}>
            <h2 style={{
              fontFamily: "var(--font-headline), serif", fontSize: 20, fontWeight: 400,
              color: "var(--text-primary)", marginBottom: 16,
            }}>
              Editar categoría
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Nombre</label>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Query de búsqueda</label>
                <input type="text" value={editQuery} onChange={(e) => setEditQuery(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Color</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: c, border: editColor === c ? "2px solid var(--text-primary)" : "none",
                        cursor: "pointer", padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                <button
                  onClick={() => setEditing(null)}
                  style={{
                    flex: 1, height: 44, borderRadius: 9999,
                    background: "transparent", border: "1px solid var(--separator)",
                    fontSize: 14, color: "var(--text-secondary)", cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    flex: 1, height: 44, borderRadius: 9999,
                    background: "var(--accent)", color: "#fff",
                    fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
