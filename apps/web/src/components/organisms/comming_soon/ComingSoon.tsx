"use client";

import { motion } from "framer-motion";
import { ReactNode, useEffect, useMemo, useRef } from "react";

interface ComingSoonProps {
  title: string;
  subtitle?: string;
  status?: string;
  children?: ReactNode;
  className?: string;
}

export default function ComingSoon({
  title,
  subtitle,
  children,
  className = "",
}: ComingSoonProps) {
  return (
    <section
      className={`relative py-4 min-h-screen overflow-hidden bg-royal-gold-dark/10 text-white ${className}`}
    >
      <AuroraGlow />
      <PerspectiveGrid />
      <ParticleField />

      <div className="relative z-20 flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-4 text-xs uppercase tracking-[0.45em] text-royal-gold">
              COMING SOON...
            </div>

            <h1
              className="
                font-black
                tracking-tight
                text-6xl
                md:text-8xl
                lg:text-[9rem]
                text-royal-gold
              "
              style={{
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <p className="mx-auto mt-6 max-w-2xl text-lg text-royal-gold">
                {subtitle}
              </p>
            )}
          </motion.div>

          <motion.div
            className="mt-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.15,
            }}
          >
          </motion.div>

          {children && (
            <motion.div
              className="mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.6,
              }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

function AuroraGlow() {
  return (
    <>
      <motion.div
        className="
          absolute
          left-[-10%]
          top-[-10%]
          h-[40rem]
          w-[40rem]
          rounded-full
          bg-[#f5c451]/20
          blur-[140px]
        "
        animate={{
          x: [-50, 40, -50],
          y: [0, 50, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 14,
        }}
      />

      <motion.div
        className="
          absolute
          bottom-[-15%]
          right-[-10%]
          h-[35rem]
          w-[35rem]
          rounded-full
          bg-[#f5c451]/15
          blur-[120px]
        "
        animate={{
          x: [50, -50, 50],
          y: [20, -30, 20],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
        }}
      />
    </>
  );
}

function PerspectiveGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="
          absolute
          left-1/2
          top-[55%]
          h-[200vh]
          w-[200vw]
          -translate-x-1/2
        "
        style={{
          backgroundSize: "70px 70px",
          transform: "perspective(1200px) rotateX(78deg)",
          transformOrigin: "center top",
        }}
      />
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 90 }).map(() => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      })),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();

    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", onMove);

    let raf: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;

        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          p.x += dx * 0.005;
          p.y += dy * 0.005;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#f5c451";
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i]!.x - particles[j]!.x;
          const dy = particles[i]!.y - particles[j]!.y;

          const d = Math.sqrt(dx * dx + dy * dy);

          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i]!.x, particles[i]!.y);
            ctx.lineTo(particles[j]!.x, particles[j]!.y);

            ctx.strokeStyle = `rgba(212,212,255,${(120 - d) / 1200})`;

            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [particles]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-10" />;
}
