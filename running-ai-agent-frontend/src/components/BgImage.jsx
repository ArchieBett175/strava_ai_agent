import React, { useEffect, useRef } from "react";

const BgImage = ({ children }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const spacing = 100;
    const points = [];

    for (let x = 0; x < canvas.width; x += spacing) {
      for (let y = 0; y < canvas.height; y += spacing) {
        points.push({ x, y, alpha: 0.2 });
      }
    }

    let mouse = { x: 0, y: 0 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    function draw() {
      ctx.fillStyle = "#0b0b09";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let p of points) {
        const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        const maxDist = 200;

        p.alpha = Math.max(0.1, 1 - dist / maxDist);

        const size = dist < 80 ? 8 : 5;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.moveTo(p.x - 5, p.y);
        ctx.lineTo(p.x + 5, p.y);
        ctx.moveTo(p.x, p.y - 5);
        ctx.lineTo(p.x, p.y + 5);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <canvas ref={canvasRef} className="w-full h-full block"></canvas>
      </div>
      <div className="z-10">{children}</div>
    </>
  );
};

export default BgImage;
