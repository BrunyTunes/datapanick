/* datapanick: drift engine
   - spawns nodes from a content array
   - random placement + gentle drift
   - click-to-front + drag support
   - dblclick opens artifact pages
*/

const nodesData = [
  {
    id: "dp-000",
    tag: "definition",
    flare: "cold",
    title: "datapanick",
    body: "A field for artifacts produced when bodies try to interpret system-generated signals that were never meant to be understood.",
    hint: "Drag me. Click to bring forward. Refresh to reshuffle.",
    href: "/artifacts/a000.html"
  },
  {
    id: "dp-001",
    tag: "axiom",
    flare: "warn",
    title: "translation failure",
    body: "If it feels raw, ask what shaped it. If it feels certain, ask what it erased.",
    hint: "Everything here is mediated. Including the feeling.",
    href: "/artifacts/a001.html"
  },
  {
    id: "dp-002",
    tag: "protocol",
    flare: "hot",
    title: "artifact rule",
    body: "An artifact belongs when you can name the signal that produced the feeling—and the point where meaning failed to translate.",
    hint: "No timeline. No feed. Re-entry only.",
    href: "/artifacts/a002.html"
  }
];

const stage = document.getElementById("stage");

let z = 10;
const live = new Map(); // id -> { el, x, y, vx, vy, w, h }

function rand(min, max){ return Math.random() * (max - min) + min; }

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

function spawnNode(d){
  const el = document.createElement("div");
  el.className = "node pulse";
  el.dataset.id = d.id;
  el.dataset.flare = d.flare || "cold";

  el.innerHTML = `
    <div class="meta">
      <span class="tag">${escapeHtml(d.tag || "node")}</span>
      <span>${escapeHtml(d.id)}</span>
    </div>
    <h2>${escapeHtml(d.title || "untitled")}</h2>
    <p>${escapeHtml(d.body || "")}</p>
    ${d.hint ? `<p class="hint">${escapeHtml(d.hint)}</p>` : ""}
  `;

  // add to DOM first so we can measure dimensions
  stage.appendChild(el);
  const rect = el.getBoundingClientRect();

  // random start position (with padding)
  const pad = 22;
  const w = stage.clientWidth;
  const h = stage.clientHeight;

  const x = rand(pad, Math.max(pad, w - rect.width - pad));
  const y = rand(90, Math.max(90, h - rect.height - pad)); // keep clear of header area

  // gentle drift velocity
  const vx = rand(-0.12, 0.12);
  const vy = rand(-0.10, 0.10);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = `${++z}`;

  // focus / bring front
  el.addEventListener("pointerdown", () => {
    el.style.zIndex = `${++z}`;
  });

  // open artifact on double-click (keeps drag behavior intact)
  el.addEventListener("dblclick", () => {
    if (d.href) window.location.href = d.href;
  });

  // drag
  enableDrag(el);

  live.set(d.id, { el, x, y, vx, vy, w: rect.width, h: rect.height });
}

function enableDrag(el){
  let dragging = false;
  let startX = 0, startY = 0;
  let baseX = 0, baseY = 0;

  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;

    const id = el.dataset.id;
    const s = live.get(id);
    if (!s) return;

    baseX = s.x;
    baseY = s.y;

    // stop drift while dragging
    s.vx = 0;
    s.vy = 0;
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const id = el.dataset.id;
    const s = live.get(id);
    if (!s) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    s.x = baseX + dx;
    s.y = baseY + dy;

    el.style.left = `${s.x}px`;
    el.style.top = `${s.y}px`;
  });

  el.addEventListener("pointerup", () => {
    dragging = false;
    const id = el.dataset.id;
    const s = live.get(id);
    if (!s) return;

    // resume subtle drift based on where it was dropped
    s.vx = rand(-0.12, 0.12);
    s.vy = rand(-0.10, 0.10);
  });
}

function tick(){
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const pad = 18;

  for (const s of live.values()){
    s.x += s.vx;
    s.y += s.vy;

    const maxX = w - s.w - pad;
    const maxY = h - s.h - pad;

    // bounce softly off edges
    if (s.x < pad){ s.x = pad; s.vx *= -1; }
    if (s.x > maxX){ s.x = maxX; s.vx *= -1; }

    // keep clear of the header/controls area
    if (s.y < 86){ s.y = 86; s.vy *= -1; }
    if (s.y > maxY){ s.y = maxY; s.vy *= -1; }

    s.el.style.left = `${s.x}px`;
    s.el.style.top = `${s.y}px`;
  }

  requestAnimationFrame(tick);
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function init(){
  // spawn nodes
  nodesData.forEach(spawnNode);

  // reshuffle button
  const reshuffle = document.getElementById("reshuffle");
  if (reshuffle){
    reshuffle.addEventListener("click", () => location.reload());
  }

  // overlay toggle
  const help = document.getElementById("help");
  const overlay = document.getElementById("overlay");
  const close = document.getElementById("closeOverlay");

  if (help && overlay){
    help.addEventListener("click", () => overlay.classList.add("open"));
  }
  if (close && overlay){
    close.addEventListener("click", () => overlay.classList.remove("open"));
  }
  if (overlay){
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  }

  requestAnimationFrame(tick);
}

window.addEventListener("load", init);
