// =========================
// Utilities
// =========================
function pad2(n) {
  return String(n).padStart(2, "0");
}
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// =========================
// Analog + Digital Clock
// =========================
const hourHand = document.getElementById("hourHand");
const minuteHand = document.getElementById("minuteHand");
const secondHand = document.getElementById("secondHand");
const digitalTime = document.getElementById("digitalTime");
const digitalDate = document.getElementById("digitalDate");

const timeSource = document.getElementById("timeSource");
const showMs = document.getElementById("showMs");

function getNow() {
  const now = new Date();
  if (timeSource.value === "utc") {
    // Create a Date representing "now" but read as UTC fields.
    // We'll keep the Date object, but use getUTC* getters below.
    return now;
  }
  return now;
}

function updateClock() {
  const now = getNow();

  let h, m, s, ms, year, month, day;
  if (timeSource.value === "utc") {
    h = now.getUTCHours();
    m = now.getUTCMinutes();
    s = now.getUTCSeconds();
    ms = now.getUTCMilliseconds();
    year = now.getUTCFullYear();
    month = now.getUTCMonth();
    day = now.getUTCDate();
  } else {
    h = now.getHours();
    m = now.getMinutes();
    s = now.getSeconds();
    ms = now.getMilliseconds();
    year = now.getFullYear();
    month = now.getMonth();
    day = now.getDate();
  }

  const secFrac = (s + ms / 1000) / 60;
  const minFrac = (m + (s + ms / 1000) / 60) / 60;
  const hourFrac = ((h % 12) + (m + (s + ms / 1000) / 60) / 60) / 12;

  const secAngle = secFrac * 360;
  const minAngle = minFrac * 360;
  const hourAngle = hourFrac * 360;

  secondHand.style.transform = `translate(-50%, -100%) rotate(${secAngle}deg)`;
  minuteHand.style.transform = `translate(-50%, -100%) rotate(${minAngle}deg)`;
  hourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;

  const msPart = showMs.checked ? `.${String(ms).padStart(3, "0")}` : "";
  digitalTime.textContent = `${pad2(h)}:${pad2(m)}:${pad2(s)}${msPart}`;

  const date = new Date(Date.UTC(year, month, day));
  const dateStr = timeSource.value === "utc"
    ? `${date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })} (UTC)`
    : `${now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

  digitalDate.textContent = dateStr;

  requestAnimationFrame(updateClock);
}

// Build tick marks once
(function buildTicks() {
  const ticks = document.getElementById("ticks");
  for (let i = 0; i < 60; i++) {
    const t = document.createElement("div");
    t.className = "tick" + (i % 5 === 0 ? " major" : "");
    t.style.transform = `translate(-50%, -50%) rotate(${i * 6}deg) translateY(-102px)`;
    // t.style.transform = `rotate(${i * 6}deg) translateY(-102px)`;
    // t.style.left = "50%"; //
    // t.style.top = "50%"; //
    ticks.appendChild(t);
  }
})();

requestAnimationFrame(updateClock);

// =========================
// Moon Phase (No API)
// =========================
// Approach:
// 1) Convert current time to Julian Day (JD).
// 2) Compute days since a known reference new moon (JDN of 2000-01-06 18:14 UT is commonly used).
// 3) Normalize by synodic month length to get phase [0..1).
// 4) Derive illumination and a human-friendly phase name.
// This is an approximation but generally good for a “watch setting” tool.

const moonCanvas = document.getElementById("moonCanvas");
const ctx = moonCanvas.getContext("2d");

const moonName = document.getElementById("moonName");
const moonIllum = document.getElementById("moonIllum");
const moonAge = document.getElementById("moonAge");

const moonUpdateRate = document.getElementById("moonUpdateRate");
const moonRecalcBtn = document.getElementById("moonRecalcBtn");

function toJulianDay(date) {
  // Julian Day from Unix time:
  // JD = UnixSeconds / 86400 + 2440587.5
  return date.getTime() / 86400000 + 2440587.5;
}

function getMoonPhaseInfo(date) {
  // Reference: known new moon near 2000-01-06 18:14 UT
  // JD for 2000-01-06 18:14 UT ≈ 2451550.1
  const jd = toJulianDay(date);
  const synodicMonth = 29.530588853;

  const daysSinceRef = jd - 2451550.1;
  let phase = (daysSinceRef / synodicMonth) % 1;
  if (phase < 0) phase += 1;

  // Moon age in days since new:
  const age = phase * synodicMonth;

  // Illumination: 0..1
  // A decent approximation: illum = (1 - cos(2πphase)) / 2
  const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;

  // Phase name buckets (8-phase)
  const name = phaseNameFromPhase(phase);

  return { phase, age, illum, name };
}

function phaseNameFromPhase(phase) {
  // phase in [0,1)
  // 0 = New, 0.25 = First Quarter, 0.5 = Full, 0.75 = Last Quarter
  const eighth = 1 / 8;

  if (phase < 1 * eighth) return "New Moon";
  if (phase < 2 * eighth) return "Waxing Crescent";
  if (phase < 3 * eighth) return "First Quarter";
  if (phase < 4 * eighth) return "Waxing Gibbous";
  if (phase < 5 * eighth) return "Full Moon";
  if (phase < 6 * eighth) return "Waning Gibbous";
  if (phase < 7 * eighth) return "Last Quarter";
  return "Waning Crescent";
}

function drawMoon(phase) {
  const w = moonCanvas.width;
  const h = moonCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.38;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();

  // Base moon disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(240,243,248,0.92)";
  ctx.fill();

  // Add a subtle texture noise-ish dots (super simple)
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  for (let i = 0; i < 120; i++) {
    const x = cx + (Math.random() * 2 - 1) * r;
    const y = cy + (Math.random() * 2 - 1) * r;
    const rr = Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Shadow overlay to represent phase.
  // We’ll draw a dark circle and then "cut" a shifted bright portion using composite ops.
  // Determine waxing vs waning by whether phase < 0.5
  const waxing = phase < 0.5;

  // Convert phase to terminator shift:
  // At new moon: fully dark (shift ~ r)
  // At full moon: fully bright (shift ~ -r)
  // We'll map phase to cos curve around full/new for nicer shape.
  // k in [-1..1], where -1 = full, +1 = new
  const k = Math.cos(2 * Math.PI * phase);

  // Shadow circle shift
  // When waxing: shadow circle shifted right/left opposite vs waning.
  const shift = k * r; // range ~[-r..r]
  const sx = cx + (waxing ? shift : -shift);

  // Darken the whole disc first
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(8,10,14,0.88)";
  ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);

  // Then add back the illuminated part by drawing a "light" circle with source-atop
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(sx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Rim
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

let moonTimer = null;

function updateMoon() {
  const now = new Date(); // local time; phase calc works fine either way for a POC
  const info = getMoonPhaseInfo(now);

  moonName.textContent = info.name;
  moonIllum.textContent = Math.round(info.illum * 100);
  moonAge.textContent = info.age.toFixed(2);

  drawMoon(info.phase);
}

function setMoonInterval() {
  if (moonTimer) clearInterval(moonTimer);
  const seconds = Number(moonUpdateRate.value);
  moonTimer = setInterval(updateMoon, seconds * 1000);
}

moonUpdateRate.addEventListener("change", () => {
  setMoonInterval();
});

moonRecalcBtn.addEventListener("click", () => {
  updateMoon();
});

updateMoon();
setMoonInterval();

// =========================
// Optional watch list (local-only)
// =========================
const watchNameInput = document.getElementById("watchName");
const addWatchBtn = document.getElementById("addWatchBtn");
const watchItems = document.getElementById("watchItems");

function loadWatches() {
  const raw = localStorage.getItem("watches_poc");
  return raw ? JSON.parse(raw) : [];
}
function saveWatches(watches) {
  localStorage.setItem("watches_poc", JSON.stringify(watches));
}
function renderWatches() {
  const watches = loadWatches();
  watchItems.innerHTML = "";
  for (const w of watches) {
    const li = document.createElement("li");
    li.textContent = w;
    watchItems.appendChild(li);
  }
}
addWatchBtn.addEventListener("click", () => {
  const name = (watchNameInput.value || "").trim();
  if (!name) return;
  const watches = loadWatches();
  watches.push(name);
  saveWatches(watches);
  watchNameInput.value = "";
  renderWatches();
});
renderWatches();
