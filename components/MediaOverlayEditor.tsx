"use client";

import React from "react";
import { Type, Palette, Layout, Sparkles, Image as ImageIcon } from "lucide-react";

export interface OverlayConfig {
  text?: string;
  font?: "SANS" | "SERIF" | "IMPACT" | "SCRIPT" | "MONO";
  color?: string;
  position?: "TOP_LEFT" | "TOP_CENTER" | "TOP_RIGHT" | "CENTER" | "BOTTOM_LEFT";
  bgStyle?: "DARK_BANNER" | "SOLID_BADGE" | "GLOW_TEXT" | "NO_BG";
}

interface MediaOverlayEditorProps {
  config: OverlayConfig;
  onChange: (updated: OverlayConfig) => void;
  sampleImageUrl?: string;
}

const FONTS = [
  { id: "SANS", name: "Modern Sans", cssClass: "font-sans font-bold" },
  { id: "SERIF", name: "Elegant Serif", cssClass: "font-serif italic font-semibold" },
  { id: "IMPACT", name: "Bold Impact", cssClass: "font-black uppercase tracking-wider" },
  { id: "SCRIPT", name: "Handwritten", cssClass: "font-mono italic tracking-tight font-medium" },
  { id: "MONO", name: "Monospace", cssClass: "font-mono font-semibold" },
];

const COLORS = [
  { hex: "#FFFFFF", name: "Pure White" },
  { hex: "#FFD700", name: "Luxury Gold" },
  { hex: "#FFEE00", name: "Vibrant Yellow" },
  { hex: "#00FFFF", name: "Cyan Blue" },
  { hex: "#FF1493", name: "Hot Pink" },
  { hex: "#000000", name: "Deep Black" },
];

const POSITIONS = [
  { id: "TOP_LEFT", name: "Top Left", cssClass: "top-4 left-4" },
  { id: "TOP_CENTER", name: "Top Center", cssClass: "top-4 left-1/2 -translate-x-1/2" },
  { id: "TOP_RIGHT", name: "Top Right", cssClass: "top-4 right-4" },
  { id: "CENTER", name: "Center", cssClass: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" },
  { id: "BOTTOM_LEFT", name: "Bottom Left", cssClass: "bottom-4 left-4" },
];

const BG_STYLES = [
  { id: "DARK_BANNER", name: "Dark Glass", cssClass: "bg-black/70 text-white backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-white/20" },
  { id: "SOLID_BADGE", name: "Solid Blue Pill", cssClass: "bg-blue-600 text-white px-3.5 py-1.5 rounded-full shadow-lg" },
  { id: "GLOW_TEXT", name: "Text Glow", cssClass: "drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] px-2 py-1" },
  { id: "NO_BG", name: "Clean Text", cssClass: "px-2 py-1" },
];

export default function MediaOverlayEditor({
  config,
  onChange,
  sampleImageUrl
}: MediaOverlayEditorProps) {
  const currentFont = FONTS.find(f => f.id === (config.font || "SANS")) || FONTS[0];
  const currentPos = POSITIONS.find(p => p.id === (config.position || "TOP_LEFT")) || POSITIONS[0];
  const currentBg = BG_STYLES.find(b => b.id === (config.bgStyle || "DARK_BANNER")) || BG_STYLES[0];
  const currentColor = config.color || "#FFFFFF";

  const handleChange = (field: keyof OverlayConfig, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Photo & Video Text Overlay
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Add custom overlay phrases (e.g. "Special Offer", "All Utilities Included") with custom font styling.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Overlay Text Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-zinc-500" />
              Overlay Text / Phrase
            </label>
            <input
              type="text"
              placeholder="e.g. SPECIAL OFFER - KES 25,000 / MO"
              value={config.text || ""}
              onChange={(e) => handleChange("text", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Font Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Font Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FONTS.map((font) => {
                const isSelected = (config.font || "SANS") === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => handleChange("font", font.id)}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-bold shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                    }`}
                  >
                    <span className={`text-sm ${font.cssClass}`}>Aa</span>
                    <span className="text-[11px] font-medium">{font.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-zinc-500" />
              Text Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => {
                const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => handleChange("color", c.hex)}
                    className={`w-9 h-9 rounded-full border-2 transition flex items-center justify-center ${
                      isSelected ? "border-purple-600 scale-110 shadow-md" : "border-zinc-300 dark:border-zinc-700 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <span className={c.hex === "#FFFFFF" || c.hex === "#FFEE00" || c.hex === "#FFD700" ? "text-black text-xs font-bold" : "text-white text-xs font-bold"}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position & Background Badge Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-zinc-500" />
                Position
              </label>
              <select
                value={config.position || "TOP_LEFT"}
                onChange={(e) => handleChange("position", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500"
              >
                {POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Banner Background
              </label>
              <select
                value={config.bgStyle || "DARK_BANNER"}
                onChange={(e) => handleChange("bgStyle", e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500"
              >
                {BG_STYLES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Live Preview */}
        <div className="lg:col-span-5 flex flex-col">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-zinc-500" />
            Live Overlay Preview
          </label>
          
          <div className="relative w-full aspect-16/9 bg-zinc-900 rounded-2xl overflow-hidden shadow-lg border border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
            {sampleImageUrl ? (
              <img
                src={sampleImageUrl}
                alt="Overlay sample"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-zinc-900 flex flex-col items-center justify-center text-zinc-400 p-4">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-xs">Property Media Preview</span>
              </div>
            )}

            {/* Render Overlay Text on Live Preview */}
            {config.text && config.text.trim().length > 0 && (
              <div className={`absolute ${currentPos.cssClass} transition-all duration-200`}>
                <span
                  className={`${currentFont.cssClass} ${currentBg.cssClass} text-sm whitespace-nowrap`}
                  style={{ color: currentColor }}
                >
                  {config.text}
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 text-center mt-2">
            This overlay phrase will render on top of your listing photo & video in Dwelly.
          </p>
        </div>
      </div>
    </div>
  );
}
