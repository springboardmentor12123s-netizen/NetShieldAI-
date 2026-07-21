import { useEffect, useRef } from "react";

/**
 * Signature visual: a slow radar sweep over a field of drifting "flow" dots,
 * occasionally connecting two dots with a packet trace line.
 */
export default function RadarCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, cx, cy, radius;
    let animationFrame;

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      cx = w * 0.62;
      cy = h * 0.42;
      radius = Math.min(w, h) * 0.62;
    }
    window.addEventListener("resize", resize);
    resize();

    const NODE_COUNT = 46;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * radius,
      speed: (Math.random() - 0.5) * 0.0006,
      size: Math.random() * 1.6 + 0.6,
    }));

    let sweepAngle = 0;
    let traceTimer = 0;
    let activeTrace = null;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(51,230,200,0.08)";
      ctx.lineWidth = 1;
      for (let r = radius * 0.25; r <= radius; r += radius * 0.25) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (ctx.createConicGradient) {
        const grad = ctx.createConicGradient(sweepAngle - Math.PI / 2, cx, cy);
        grad.addColorStop(0, "rgba(51,230,200,0.22)");
        grad.addColorStop(0.06, "rgba(51,230,200,0.05)");
        grad.addColorStop(0.15, "rgba(51,230,200,0)");
        grad.addColorStop(1, "rgba(51,230,200,0)");
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      const positions = [];
      nodes.forEach((n) => {
        n.angle += n.speed;
        const x = cx + Math.cos(n.angle) * n.dist;
        const y = cy + Math.sin(n.angle) * n.dist * 0.6;
        positions.push({ x, y });

        const angleDiff = Math.abs(((n.angle - sweepAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const lit = angleDiff > Math.PI - 0.35;
        ctx.beginPath();
        ctx.arc(x, y, n.size * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = lit ? "rgba(51,230,200,0.9)" : "rgba(147,161,181,0.35)";
        ctx.fill();
      });

      traceTimer++;
      if (traceTimer > 90 && !activeTrace) {
        traceTimer = 0;
        const a = positions[Math.floor(Math.random() * positions.length)];
        const b = positions[Math.floor(Math.random() * positions.length)];
        activeTrace = { a, b, progress: 0 };
      }
      if (activeTrace) {
        activeTrace.progress += 0.02;
        const { a, b, progress } = activeTrace;
        const x = a.x + (b.x - a.x) * Math.min(progress, 1);
        const y = a.y + (b.y - a.y) * Math.min(progress, 1);
        ctx.strokeStyle = "rgba(76,141,255,0.4)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(76,141,255,0.9)";
        ctx.fill();
        if (progress >= 1) activeTrace = null;
      }

      sweepAngle += 0.006;
      animationFrame = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas id="radarCanvas" ref={canvasRef}></canvas>;
}
