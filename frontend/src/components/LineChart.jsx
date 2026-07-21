import { useEffect, useRef } from "react";

export default function LineChart({ points = [], height = 150, color = "#33E6C8", fillColor = "rgba(51,230,200,0.12)" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!points.length) return;

    const max = Math.max(...points.map((p) => p.count), 1);
    const padding = 6;
    const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

    const coords = points.map((p, i) => ({
      x: padding + i * stepX,
      y: height - padding - (p.count / max) * (height - padding * 2),
    }));

    ctx.beginPath();
    ctx.moveTo(coords[0].x, height - padding);
    coords.forEach((c) => ctx.lineTo(c.x, c.y));
    ctx.lineTo(coords[coords.length - 1].x, height - padding);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.beginPath();
    coords.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    const last = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [points, height, color, fillColor]);

  return <canvas className="chart" ref={canvasRef} height={height}></canvas>;
}
