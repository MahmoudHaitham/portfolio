"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";

interface SectionDividerProps {
  variant?: "wave" | "particles" | "gradient" | "beam" | "mesh";
}

export default function SectionDivider({ variant = "gradient" }: SectionDividerProps) {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  // Generate particles only on client side
  const particles = useMemo(() => {
    if (typeof window === "undefined") return [];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      initialX: Math.random() * 100,
      initialY: 100,
      path: [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
      ],
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a simple placeholder on server
    return <div className="h-32" />;
  }

  if (variant === "wave") {
    return (
      <div ref={ref} className="relative h-32 overflow-hidden">
        <motion.svg
          style={{ y, opacity }}
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <motion.path
            animate={{
              d: [
                "M0,160L48,144C96,128,192,96,288,101.3C384,107,480,149,576,154.7C672,160,768,128,864,122.7C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                "M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,154.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                "M0,160L48,144C96,128,192,96,288,101.3C384,107,480,149,576,154.7C672,160,768,128,864,122.7C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#gradient)"
            fillOpacity="0.3"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>
    );
  }

  if (variant === "particles") {
    return (
      <div ref={ref} className="relative h-32 overflow-hidden">
        <motion.div style={{ opacity }} className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              initial={{ x: `${particle.initialX}%`, y: `${particle.initialY}%` }}
              animate={{
                y: "-100%",
                x: particle.path.map(p => `${p}%`),
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
              style={{
                filter: "blur(1px)",
                boxShadow: "0 0 10px rgba(6,182,212,0.8)",
              }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  if (variant === "beam") {
    return (
      <div ref={ref} className="relative h-32 overflow-hidden">
        <motion.div
          style={{ opacity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              boxShadow: "0 0 20px rgba(6,182,212,0.8), 0 0 40px rgba(6,182,212,0.4)",
            }}
          />
        </motion.div>
      </div>
    );
  }

  if (variant === "mesh") {
    return (
      <div ref={ref} className="relative h-32 overflow-hidden">
        <motion.div style={{ opacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px]">
            <motion.div
              animate={{
                backgroundPosition: ["0px 0px", "40px 40px"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Default gradient variant
  return (
    <div ref={ref} className="relative h-32 overflow-hidden">
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          animate={{
            background: [
              "linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(59,130,246,0.3), rgba(139,92,246,0.3), transparent)",
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(59,130,246,0.3), rgba(6,182,212,0.3), transparent)",
              "linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(59,130,246,0.3), rgba(139,92,246,0.3), transparent)",
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="w-full h-full"
          style={{
            filter: "blur(40px)",
          }}
        />
        <motion.div
          animate={{
            scaleX: [0.5, 1, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
        />
      </motion.div>
    </div>
  );
}

