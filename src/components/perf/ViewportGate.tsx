"use client";
import React, { useEffect, useRef, useState } from "react";

type ViewportGateProps = {
  children: React.ReactNode;
  rootMargin?: string;
  once?: boolean;
};

export default function ViewportGate({
  children,
  rootMargin = "200px",
  once = true,
}: ViewportGateProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      // If no IO support, mount immediately
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              obs.disconnect();
            }
          }
        });
      },
      { root: null, rootMargin },
    );

    obs.observe(node);

    return () => obs.disconnect();
  }, [inView, once, rootMargin]);

  return (
    <div ref={ref as any} aria-hidden={!inView}>
      {inView ? children : null}
    </div>
  );
}
