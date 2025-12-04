"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Generate only 4 shapes for performance
const generateShapes = () => {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    size: 60 + (i * 15),
    x: (i * 25) % 100,
    y: (i * 30) % 100,
    duration: 25 + (i * 3),
    delay: i * 0.8,
  }));
};

export default function FloatingShapes() {
  const [shapes, setShapes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setShapes(generateShapes());
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute rounded-full will-change-transform"
          style={{
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            background: `radial-gradient(circle, ${
              shape.id % 3 === 0
                ? "rgba(0, 240, 255, 0.06)"
                : shape.id % 3 === 1
                ? "rgba(24, 144, 255, 0.06)"
                : "rgba(179, 71, 255, 0.06)"
            }, transparent)`,
            filter: "blur(30px)",
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, shape.id % 2 === 0 ? 15 : -15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
