/* Tiny dependency-free confetti: paper strips, dots and hearts. */
(function () {
  'use strict';

  var canvas = document.getElementById('confetti');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var running = false;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  resize();

  function heart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s * 0.3);
    ctx.bezierCurveTo(x - s / 2, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s * 0.6, x + s / 2, y + s * 0.3);
    ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  function spawn(x, y, angle, spread, count, colors) {
    for (var i = 0; i < count; i++) {
      var a = angle + (Math.random() - 0.5) * spread;
      var speed = 9 + Math.random() * 11;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 7 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.2 ? 'heart' : Math.random() < 0.5 ? 'dot' : 'strip',
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        ttl: 220 + Math.random() * 120
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(function (p) { return p.life < p.ttl && p.y < innerHeight + 40; });
    particles.forEach(function (p) {
      p.life++;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.28;
      p.x += p.vx + Math.sin(p.life / 12) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (p.ttl - p.life) / 40);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'heart') heart(0, -p.size / 2, p.size * 1.3);
      else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size / 2.5);
      ctx.restore();
    });
    if (particles.length) requestAnimationFrame(tick);
    else running = false;
  }

  window.Confetti = {
    // Several bursts from the bottom corners and the top, over ~2.5s.
    celebrate: function (colors, intensity) {
      var n = Math.round(90 * (intensity || 1));
      var w = innerWidth, h = innerHeight;
      var waves = [0, 700, 1500];
      waves.forEach(function (delay) {
        setTimeout(function () {
          spawn(0, h, -Math.PI / 3, 0.8, n, colors);
          spawn(w, h, -Math.PI * 2 / 3, 0.8, n, colors);
          spawn(w / 2, -20, Math.PI / 2, 2.4, Math.round(n / 2), colors);
          if (!running) { running = true; requestAnimationFrame(tick); }
        }, delay);
      });
    }
  };
})();
