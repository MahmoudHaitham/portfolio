"use client";

import { useEffect, useRef, useState } from "react";

export default function MagicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Only 2 orbs for better performance
    const orbs: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
    }> = [];

    const colors = [
      "rgba(0, 240, 255, 0.05)",
      "rgba(179, 71, 255, 0.05)",
    ];

    for (let i = 0; i < 2; i++) {
      orbs.push({
        x: (canvas.width / 3) * (i + 1),
        y: (canvas.height / 3) * (i + 1),
        radius: 300,
        vx: (i % 2 === 0 ? 0.2 : -0.2),
        vy: (i % 2 === 0 ? -0.2 : 0.2),
        color: colors[i],
      });
    }

    let animationId: number;
    let lastTime = 0;
    const fps = 20; // Reduce to 20 FPS for better performance
    const fpsInterval = 1000 / fps;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      const elapsed = currentTime - lastTime;
      if (elapsed < fpsInterval) return;

      lastTime = currentTime - (elapsed % fpsInterval);

      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -orb.radius || orb.x > canvas.width + orb.radius) {
          orb.vx *= -1;
        }
        if (orb.y < -orb.radius || orb.y > canvas.height + orb.radius) {
          orb.vy *= -1;
        }

        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    animate(0);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
