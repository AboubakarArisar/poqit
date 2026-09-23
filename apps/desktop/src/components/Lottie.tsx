import { useEffect, useRef } from "react";
import lottie from "lottie-web/build/player/lottie_light";

export function Lottie({ path, label, autoplay = true }: { path: string; label: string; autoplay?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!ref.current || reducedMotion) return;
    const animation = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: false, autoplay, path });
    return () => animation.destroy();
  }, [path, autoplay, reducedMotion]);
  return reducedMotion
    ? <img className="lottie" src="/assets/primarylogo.png" alt={label} />
    : <div className="lottie" ref={ref} role="img" aria-label={label} />;
}
