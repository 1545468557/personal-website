/* =========================================================
   个人网站交互与特效脚本
   1. 背景特效：极光光斑 + 雨丝（同一帧循环，可一键开关）
   2. 鼠标柔光 + 卡片跟随高光
   3. 首屏动态图形（鼠标视差）
   4. 导航、滚动入场、方法手风琴、回到顶部
   ========================================================= */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* =========================================================
     1 + 2. 背景特效
     ========================================================= */
  var auroraCanvas = document.getElementById("aurora-canvas");
  var rainCanvas = document.getElementById("rain-canvas");
  var cursorGlow = document.querySelector(".cursor-glow");
  var fxToggle = document.getElementById("fx-toggle");

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var RAIN_DPR = Math.min(window.devicePixelRatio || 1, 1.5);   // 雨丝：1.5x 足够清晰
  var AURORA_DPR = Math.min(window.devicePixelRatio || 1, 1.25); // 极光是柔和光斑，低分辨率即可
  var W = window.innerWidth;
  var H = window.innerHeight;

  var blobs = [];
  var drops = [];
  var bgRaf = null;
  var bgRunning = false;
  var effectsOn = true;
  var pointer = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, active: false };

  function sizeCanvas(canvas, scale) {
    if (!canvas) return null;
    var ctx = canvas.getContext("2d");
    canvas.width = Math.floor(W * scale);
    canvas.height = Math.floor(H * scale);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    return ctx;
  }

  var auroraCtx = auroraCanvas ? auroraCanvas.getContext("2d") : null;
  var rainCtx = rainCanvas ? rainCanvas.getContext("2d") : null;

  var PALETTE = [
    [128, 82, 255],   // iris
    [255, 184, 41],   // saffron
    [21, 132, 110],   // verdant
    [90, 150, 255]    // blue
  ];

  function buildBlobs() {
    blobs = [];
    var count = W < 700 ? 3 : 4;
    for (var i = 0; i < count; i++) {
      var c = PALETTE[i % PALETTE.length];
      blobs.push({
        color: c,
        base: { x: W * (0.2 + Math.random() * 0.6), y: H * (0.15 + Math.random() * 0.7) },
        orbit: { x: 90 + Math.random() * 150, y: 70 + Math.random() * 130 },
        size: Math.max(W, H) * (0.28 + Math.random() * 0.22),
        speed: 0.00013 + Math.random() * 0.0002,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.10 + Math.random() * 0.08
      });
    }
  }

  function buildDrops() {
    drops = [];
    var count = Math.round((W * H) / 12000);
    count = Math.max(70, Math.min(count, 320));
    for (var i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * W * 1.2 - W * 0.1,
        y: Math.random() * H,
        len: 26 + Math.random() * 96,
        speed: 1.3 + Math.random() * 4.6,
        alpha: 0.08 + Math.random() * 0.26,
        warm: Math.random() > 0.72
      });
    }
  }

  function resizeBackground() {
    W = window.innerWidth;
    H = window.innerHeight;
    auroraCtx = sizeCanvas(auroraCanvas, AURORA_DPR);
    rainCtx = sizeCanvas(rainCanvas, RAIN_DPR);
    buildBlobs();
    buildDrops();
  }

  function drawAurora(t) {
    if (!auroraCtx) return;
    auroraCtx.clearRect(0, 0, W, H);
    auroraCtx.globalCompositeOperation = "lighter";

    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var x = b.base.x + Math.cos(t * b.speed + b.phase) * b.orbit.x;
      var y = b.base.y + Math.sin(t * b.speed * 1.3 + b.phase) * b.orbit.y;
      var r = b.size * (1 + Math.sin(t * 0.0004 + b.phase) * 0.06);
      var g = auroraCtx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(" + b.color[0] + "," + b.color[1] + "," + b.color[2] + "," + b.alpha + ")");
      g.addColorStop(0.45, "rgba(" + b.color[0] + "," + b.color[1] + "," + b.color[2] + "," + (b.alpha * 0.35) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      auroraCtx.fillStyle = g;
      auroraCtx.beginPath();
      auroraCtx.arc(x, y, r, 0, Math.PI * 2);
      auroraCtx.fill();
    }
    auroraCtx.globalCompositeOperation = "source-over";
  }

  function drawRain(step) {
    if (!rainCtx) return;
    rainCtx.clearRect(0, 0, W, H);
    var drift = W * 0.05;

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.speed * step;
      d.x += d.speed * 0.18 * step;
      if (d.y - d.len > H || d.x - drift > W) {
        d.y = -d.len - Math.random() * 140;
        d.x = Math.random() * W - drift * 0.5;
      }
      var g = rainCtx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, d.warm
        ? "rgba(255,184,41," + d.alpha + ")"
        : "rgba(170,170,255," + d.alpha + ")");
      rainCtx.strokeStyle = g;
      rainCtx.lineWidth = 1.15;
      rainCtx.beginPath();
      rainCtx.moveTo(d.x, d.y - d.len);
      rainCtx.lineTo(d.x - drift * 0.14, d.y);
      rainCtx.stroke();
    }
  }

  function drawCursorGlow() {
    if (!cursorGlow || !finePointer) return;
    pointer.x += (pointer.tx - pointer.x) * 0.12;
    pointer.y += (pointer.ty - pointer.y) * 0.12;
    cursorGlow.style.transform = "translate3d(" + pointer.x + "px," + pointer.y + "px,0)";
  }

  var lastT = 0;
  var frameCount = 0;
  function bgFrame(t) {
    if (!bgRunning) return;
    var step = lastT ? Math.min((t - lastT) / 16.67, 3) : 1;
    lastT = t;
    frameCount++;

    // 极光移动很慢，隔帧绘制（省一半开销）；雨丝每帧绘制
    if (frameCount % 2 === 1) drawAurora(t);
    drawRain(step);
    drawCursorGlow();

    bgRaf = requestAnimationFrame(bgFrame);
  }

  function startBackground() {
    if (bgRunning || !effectsOn) return;
    bgRunning = true;
    lastT = 0;
    if (reduceMotion) {
      // 减少动效：只画一帧静态画面
      drawAurora(0);
      drawRain(1);
      drawCursorGlow();
      bgRunning = false;
      return;
    }
    bgRaf = requestAnimationFrame(bgFrame);
  }

  function stopBackground() {
    bgRunning = false;
    if (bgRaf) cancelAnimationFrame(bgRaf);
    bgRaf = null;
  }

  if (auroraCanvas || rainCanvas) {
    resizeBackground();
    startBackground();

    window.addEventListener("resize", function () {
      resizeBackground();
      if (!bgRunning && effectsOn && !reduceMotion) startBackground();
      else if (reduceMotion) { drawAurora(0); drawRain(1); drawCursorGlow(); }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopBackground();
      else startBackground();
    });
  }

  // 鼠标柔光
  if (cursorGlow && finePointer) {
    window.addEventListener("pointermove", function (e) {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      if (!pointer.active) {
        pointer.active = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        cursorGlow.classList.add("is-on");
      }
    }, { passive: true });
    document.addEventListener("mouseleave", function () {
      pointer.active = false;
      cursorGlow.classList.remove("is-on");
    });
  }

  // 卡片跟随高光
  if (finePointer) {
    document.querySelectorAll(".experience-card, .contact-panel, .project-visual").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  // 特效总开关
  if (fxToggle) {
    fxToggle.addEventListener("click", function () {
      effectsOn = !effectsOn;
      root.classList.toggle("effects-off", !effectsOn);
      fxToggle.setAttribute("aria-pressed", effectsOn ? "true" : "false");
      fxToggle.textContent = effectsOn ? "特效：开" : "特效：关";
      if (effectsOn) startBackground();
      else stopBackground();
    });
  }

  /* =========================================================
     3. 首屏动态图形
     ========================================================= */
  function initHero(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0;
    var nodes = [];
    var rafId = null;
    var visible = true;
    var t = 0;
    var parallax = { x: 0, y: 0, tx: 0, ty: 0 };

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = w < 520 ? 22 : 36;
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
          radius: 60 + Math.random() * Math.min(w, h) * 0.42,
          speed: (Math.random() > 0.5 ? 1 : -1) * (0.0008 + Math.random() * 0.0016),
          size: 1.1 + Math.random() * 2.4,
          warm: Math.random() > 0.68,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function frame() {
      t += 1;
      parallax.x += (parallax.tx - parallax.x) * 0.06;
      parallax.y += (parallax.ty - parallax.y) * 0.06;

      ctx.clearRect(0, 0, w, h);
      var cx = w / 2 + parallax.x;
      var cy = h / 2 + parallax.y;
      var pulse = 1 + Math.sin(t * 0.012) * 0.05;

      // 中心呼吸光晕
      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.66 * pulse);
      glow.addColorStop(0, "rgba(128,82,255,0.30)");
      glow.addColorStop(0.5, "rgba(128,82,255,0.07)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // 轨道环
      for (var r = 0; r < 3; r++) {
        var radius = Math.min(w, h) * (0.2 + r * 0.13) * pulse;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255," + (0.10 - r * 0.02) + ")";
        ctx.lineWidth = 1;
        ctx.ellipse(cx, cy, radius, radius * 0.82, Math.sin(t * 0.002 + r) * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 节点
      var points = [];
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.angle += n.speed * (reduceMotion ? 0 : 1);
        var px = cx + Math.cos(n.angle) * n.radius;
        var py = cy + Math.sin(n.angle) * n.radius * 0.82 + Math.sin(t * 0.01 + n.phase) * 6;
        points.push([px, py, n]);

        ctx.beginPath();
        ctx.fillStyle = n.warm ? "rgba(255,184,41,0.95)" : "rgba(196,182,255,0.95)";
        ctx.arc(px, py, n.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 邻近连线
      for (var a = 0; a < points.length; a++) {
        for (var b = a + 1; b < points.length; b++) {
          var dx = points[a][0] - points[b][0];
          var dy = points[a][1] - points[b][1];
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 155) continue;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(128,82,255," + (0.22 * (1 - dist / 155)) + ")";
          ctx.lineWidth = 0.8;
          ctx.moveTo(points[a][0], points[a][1]);
          ctx.lineTo(points[b][0], points[b][1]);
          ctx.stroke();
        }
      }

      if (visible && !reduceMotion) rafId = requestAnimationFrame(frame);
    }

    resize();
    frame();

    window.addEventListener("resize", function () {
      resize();
      if (reduceMotion) frame();
    });

    if (finePointer) {
      canvas.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        parallax.tx = ((e.clientX - r.left) / r.width - 0.5) * 44;
        parallax.ty = ((e.clientY - r.top) / r.height - 0.5) * 44;
      }, { passive: true });
      canvas.addEventListener("pointerleave", function () {
        parallax.tx = 0;
        parallax.ty = 0;
      });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !visible) {
            visible = true;
            if (!reduceMotion) rafId = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && visible) {
            visible = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      }, { threshold: 0.02 }).observe(canvas);
    }
  }

  initHero(document.getElementById("hero-canvas"));

  /* =========================================================
     4. 导航 / 入场 / 手风琴 / 回到顶部
     ========================================================= */
  var header = document.getElementById("site-header");
  var navLinks = document.getElementById("nav-links");
  var menuToggle = document.getElementById("menu-toggle");
  var links = navLinks ? Array.prototype.slice.call(navLinks.querySelectorAll("a")) : [];

  function onScrollHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var setActive = function (id) {
      links.forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
      });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // 滚动入场
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          setTimeout(function () { el.classList.add("is-visible"); }, i * 80);
          obs.unobserve(el);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  // 方法手风琴
  var notes = Array.prototype.slice.call(document.querySelectorAll(".note"));

  function openNote(note) {
    var content = note.querySelector(".note-content");
    if (!content) return;
    note.classList.add("is-open");
    content.style.maxHeight = content.scrollHeight + "px";
  }
  function closeNote(note) {
    var content = note.querySelector(".note-content");
    note.classList.remove("is-open");
    if (content) content.style.maxHeight = "0px";
  }

  notes.forEach(function (note) {
    var head = note.querySelector(".note-head");
    if (!head) return;
    head.addEventListener("click", function () {
      var willOpen = !note.classList.contains("is-open");
      // 一次只展开一条；想允许多条同时展开，删掉这段 notes.forEach
      notes.forEach(function (other) {
        if (other !== note && other.classList.contains("is-open")) {
          closeNote(other);
          var oh = other.querySelector(".note-head");
          if (oh) oh.setAttribute("aria-expanded", "false");
        }
      });
      if (willOpen) openNote(note);
      else closeNote(note);
      head.setAttribute("aria-expanded", willOpen ? "true" : "false");
      var content = note.querySelector(".note-content");
      if (content) content.setAttribute("aria-hidden", willOpen ? "false" : "true");
    });
  });

  window.addEventListener("resize", function () {
    notes.forEach(function (note) {
      if (!note.classList.contains("is-open")) return;
      var content = note.querySelector(".note-content");
      if (content) content.style.maxHeight = content.scrollHeight + "px";
    });
  });

  // 回到顶部 / 年份
  var backTop = document.getElementById("back-top");
  if (backTop) {
    window.addEventListener("scroll", function () {
      backTop.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
