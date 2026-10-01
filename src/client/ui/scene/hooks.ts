"use client";

// Small hooks the scenes share: is it on screen, how far through a tall section you have
// scrolled, and where your pointer is (for parallax). Each writes as little as it can: the
// pointer goes straight to CSS variables, and scroll progress only updates in small steps.

import { useEffect, useState, type RefObject } from "react";

/** True while the element is on screen (or near it). */
export function useInView(ref: RefObject<Element | null>, margin = "0px"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e?.isIntersecting ?? false), {
      rootMargin: margin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return inView;
}

/**
 * How far you have scrolled through a tall section, 0 at its top reaching the top of the
 * window, 1 at its bottom reaching the bottom. In steps of 1/200, so it re-renders rarely.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : r.top < 0 ? 1 : 0;
      setProgress(Math.round(p * 200) / 200);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(measure));
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return progress;
}

/**
 * Pointer parallax: --px and --py on the element, -1 to 1 across the window, eased. Layers
 * move by them at their own depth. Still, with reduced motion.
 */
export function usePointerParallax(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const aim = { x: 0, y: 0 };
    const at = { x: 0, y: 0 };
    let raf = 0;
    const tick = () => {
      at.x += (aim.x - at.x) * 0.06;
      at.y += (aim.y - at.y) * 0.06;
      el.style.setProperty("--px", at.x.toFixed(3));
      el.style.setProperty("--py", at.y.toFixed(3));
      raf = Math.abs(aim.x - at.x) + Math.abs(aim.y - at.y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      aim.x = (e.clientX / window.innerWidth) * 2 - 1;
      aim.y = (e.clientY / window.innerHeight) * 2 - 1;
      raf ||= requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [ref]);
}

/** The visitor asked for less motion. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  return reduce;
}

/**
 * How far you have scrolled through a tall section whose stage stays pinned while you do, as a
 * CSS variable on the section (0 as the stage pins, 1 as it lets go). Written straight to CSS, so
 * what is on the stage moves with your scroll without re-rendering, and eased toward where you
 * are rather than jumping there: a phone's scroll arrives in coarse steps, and the motion should
 * still glide (Turki, Day 5). 1 with reduced motion: the end of the story, held still.
 */
export function usePinnedProgress(ref: RefObject<HTMLElement | null>, name: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty(name, "1");
      return;
    }
    let raf = 0;
    let shown = -1;
    const target = () => {
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    };
    const tick = () => {
      const aim = target();
      // A fifth of the way there each frame: quick to follow, never a jump.
      shown = shown < 0 ? aim : shown + (aim - shown) * 0.2;
      if (Math.abs(aim - shown) < 0.0005) shown = aim;
      el.style.setProperty(name, shown.toFixed(4));
      raf = shown === aim ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(tick));
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, name]);
}
