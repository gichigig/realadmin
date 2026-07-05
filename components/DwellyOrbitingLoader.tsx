"use client";

import React from "react";

interface DwellyOrbitingLoaderProps {
  size?: number; // size in px, default 64
  className?: string;
}

/// A Reddit-style orbiting loader for the Dwelly realadmin web portal.
/// Features a pulsing central logo badge with a neon cyan satellite dot orbiting around it.
export default function DwellyOrbitingLoader({
  size = 64,
  className = "",
}: DwellyOrbitingLoaderProps) {
  const logoSize = Math.round(size * 0.62);
  const dotSize = Math.max(6, Math.round(size * 0.14));

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Subtle outer orbit track line */}
      <div
        className="absolute rounded-full border border-cyan-500/20"
        style={{ width: `${size}px`, height: `${size}px` }}
      />

      {/* Rotating satellite dot track */}
      <div
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: "1.6s", animationTimingFunction: "linear" }}
      >
        {/* Glowing satellite dot positioned at the top edge */}
        <div
          className="absolute rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4,0_0_24px_#22d3ee]"
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Bright white core */}
          <div className="w-full h-full rounded-full bg-white scale-75" />
        </div>
      </div>

      {/* Center pulsing logo emblem */}
      <div
        className="animate-pulse rounded-full overflow-hidden shadow-md flex items-center justify-center"
        style={{
          width: `${logoSize}px`,
          height: `${logoSize}px`,
          animationDuration: "2s",
        }}
      >
        <img
          src="/icon.png"
          alt="Loading..."
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
