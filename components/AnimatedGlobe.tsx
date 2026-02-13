"use client";

import { useEffect, useRef } from "react";

export default function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setSize = () => {
      canvas.width = 500;
      canvas.height = 500;
    };
    setSize();

    // Globe parameters
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;
    let rotation = 0;

    // Connection points on the globe (latitude, longitude in radians)
    const points = [
      { lat: 0.5, lon: 0, name: "Africa" },
      { lat: 0.8, lon: 1.5, name: "Europe" },
      { lat: 0.6, lon: -1.8, name: "Americas" },
      { lat: 0.3, lon: 2.5, name: "Asia" },
      { lat: -0.5, lon: 2.8, name: "Australia" },
      { lat: 0.7, lon: -0.5, name: "Atlantic" },
      { lat: 0.4, lon: 1.2, name: "Middle East" },
      { lat: 0.9, lon: -2.5, name: "North America" },
      { lat: -0.3, lon: -1.2, name: "South America" },
      { lat: 0.2, lon: 3.0, name: "Southeast Asia" },
    ];

    // Convert spherical to 2D coordinates with rotation
    const sphereTo2D = (lat: number, lon: number, rot: number) => {
      const adjustedLon = lon + rot;
      const x = centerX + radius * Math.cos(lat) * Math.sin(adjustedLon);
      const y = centerY - radius * Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(adjustedLon);
      return { x, y, z, visible: z > -0.2 };
    };

    // Animation frame
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.8,
        centerX,
        centerY,
        radius * 1.3
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
      gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.05)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Draw globe sphere
      const sphereGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius
      );
      sphereGradient.addColorStop(0, "rgba(96, 165, 250, 0.4)");
      sphereGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.3)");
      sphereGradient.addColorStop(1, "rgba(37, 99, 235, 0.2)");
      ctx.fillStyle = sphereGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw globe outline
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw latitude lines
      ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
      ctx.lineWidth = 1;
      for (let lat = -0.8; lat <= 0.8; lat += 0.4) {
        ctx.beginPath();
        const latRadius = radius * Math.cos(lat);
        const latY = centerY - radius * Math.sin(lat);
        ctx.ellipse(centerX, latY, latRadius, latRadius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw longitude lines
      for (let lon = 0; lon < Math.PI; lon += Math.PI / 6) {
        ctx.beginPath();
        const adjustedLon = lon + rotation;
        ctx.ellipse(
          centerX,
          centerY,
          radius * Math.abs(Math.sin(adjustedLon)),
          radius,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Calculate point positions
      const pointPositions = points.map((p) => ({
        ...p,
        ...sphereTo2D(p.lat, p.lon, rotation),
      }));

      // Draw connections between visible points
      ctx.lineWidth = 1.5;
      for (let i = 0; i < pointPositions.length; i++) {
        for (let j = i + 1; j < pointPositions.length; j++) {
          const p1 = pointPositions[i];
          const p2 = pointPositions[j];
          
          if (p1.visible && p2.visible) {
            // Only connect nearby points
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < radius * 1.5) {
              const opacity = Math.max(0.1, 0.6 - dist / (radius * 2));
              const avgZ = (p1.z + p2.z) / 2;
              const zOpacity = Math.max(0.2, avgZ);
              
              ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * zOpacity})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              
              // Curved connection line
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              const curveOffset = dist * 0.1;
              const ctrlX = midX;
              const ctrlY = midY - curveOffset;
              
              ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw points
      pointPositions.forEach((p, index) => {
        if (p.visible && p.z > 0) {
          const pulse = Math.sin(Date.now() / 500 + index) * 0.3 + 0.7;
          const pointRadius = Math.max(1, 5 * p.z * pulse);
          const glowRadius = Math.max(3, pointRadius * 3);
          
          // Point glow
          const pointGradient = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            glowRadius
          );
          pointGradient.addColorStop(0, `rgba(59, 130, 246, ${0.8 * p.z})`);
          pointGradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.3 * p.z})`);
          pointGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
          ctx.fillStyle = pointGradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Point core
          ctx.fillStyle = `rgba(255, 255, 255, ${p.z})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw animated data packets traveling along connections
      const time = Date.now() / 1000;
      for (let i = 0; i < pointPositions.length - 1; i++) {
        const p1 = pointPositions[i];
        const p2 = pointPositions[(i + 3) % pointPositions.length];
        
        if (p1.visible && p2.visible) {
          const t = ((time + i * 0.5) % 2) / 2; // 0 to 1 over 2 seconds
          const packetX = p1.x + (p2.x - p1.x) * t;
          const packetY = p1.y + (p2.y - p1.y) * t - Math.sin(t * Math.PI) * 20;
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.beginPath();
          ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Continuous endless rotation - wrap around at 2*PI to prevent overflow
      rotation = (rotation + 0.008) % (Math.PI * 2);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[400px] h-[400px] md:w-[500px] md:h-[500px]"
        style={{ maxWidth: "100%" }}
      />
    </div>
  );
}
