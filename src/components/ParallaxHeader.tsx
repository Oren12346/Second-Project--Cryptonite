import { useEffect, useMemo, useState } from "react";
import "./ParallaxHeader.css";

export default function ParallaxHeader() {
  const [scrollY, setScrollY] = useState(0);

  // Detect reduced motion preference (client-side)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    function onScroll() {
      setScrollY(window.scrollY || 0);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [prefersReducedMotion]);

  // Parallax transforms (scroll-based)
  const bgTransform = prefersReducedMotion
    ? undefined
    : { transform: `translateY(${Math.min(scrollY * 0.12, 40)}px) scale(1.08)` };

  const glowTransform = prefersReducedMotion
    ? undefined
    : { transform: `translate(${Math.min(scrollY * 0.08, 30)}px, ${Math.min(scrollY * 0.06, 22)}px)` };

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true" style={bgTransform} />
      <div className="hero__glow" aria-hidden="true" style={glowTransform} />

      <div className="hero__inner">
        <p className="hero__kicker">Crypto • Insights • Portfolio</p>

        <h1 className="hero__title">
          Welcome to <span className="hero__titleAccent">Cryptonite</span>
        </h1>

        <p className="hero__subtitle">
          Track trends, explore reports, and build a clean dashboard experience
          with React + TypeScript.
        </p>
      </div>
    </section>
  );
}