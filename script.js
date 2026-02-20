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
const useAmPm = document.getElementById("useAmPm");

// =========================
// GMT / 24-hour bezel helper
// =========================
const gmtHand = document.getElementById("gmtHand");
const gmtTicks = document.getElementById("gmtTicks");
const gmtCity = document.getElementById("gmtCity");
const gmtReadout = document.getElementById("gmtReadout");
const gmtSubReadout = document.getElementById("gmtSubReadout");
const bezelStyle = document.getElementById("bezelStyle");
const gmtBezel = document.getElementById("gmtBezel");


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
  //digitalTime.textContent = `${pad2(h)}:${pad2(m)}:${pad2(s)}${msPart}`;

  // add AM/PM functionality
  let displayHour = h;
  let suffix = "";

  if (useAmPm.checked) {
    suffix = h >= 12 ? " PM" : " AM";
    displayHour = h % 12;
    if (displayHour === 0) displayHour = 12; // midnight/noon correction
  }

  digitalTime.textContent =
    `${pad2(displayHour)}:${pad2(m)}:${pad2(s)}${msPart}${suffix}`;

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

(function buildGmtTicks() {
  // Clear any existing marks (in case of hot reload)
  gmtTicks.innerHTML = "";

  const radius = 102; // match your translateY(-102px)

  for (let i = 0; i < 24; i++) {
    const angle = i * 15; // 360/24

    const el = document.createElement("div");
    el.classList.add("gmt-mark");

    // Position around circle
    // 0 at top, increasing clockwise
    const rad = (angle - 90) * (Math.PI / 180);
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    el.style.left = `calc(50% + ${x}px)`;
    el.style.top = `calc(50% + ${y}px)`;

    if (i === 0) {
      // Triangle at 24/0
      el.classList.add("gmt-tri");
    } else if (i % 2 === 0) {
      // Even indices: numerals 2,4,...,22
      el.classList.add("gmt-num");
      el.textContent = String(i);
    } else {
      // Odd indices: dots
      el.classList.add("gmt-dot");
    }

    gmtTicks.appendChild(el);
  }
})();

function applyBezelStyle(style) {
  const styles = {
    batman: { top: "rgba(10,10,12,0.92)", bottom: "rgba(40,70,150,0.92)", hand: "rgba(110, 168, 255, 0.92)"}, // black/blue/blue gmt
    coke: { top: "rgba(10,10,12,0.92)", bottom: "rgba(150,35,35,0.92)", hand: "rgba(150,35,35,0.92)"}, // black/red/red gmt
    bruce: { top: "rgba(10,10,12,0.92)", bottom: "rgba(80,85,95,0.92)", hand: "rgba(16, 116, 50, 0.92)"},  // black/gray/green gmt
    pepsi: { top: "rgba(40,70,150,0.92)", bottom: "rgba(150,35,35,0.92)", hand: "rgba(150,35,35,0.92)"}, // blue/red/red gmt
    root_beer: { top: "rgba(10,10,12,0.92)", bottom: "rgba(71, 32, 26, 0.92)", hand: "rgba(71, 32, 26, 0.92)"} // black/brown/white gmt

  };

  const s = styles[style] || styles.batman;
  gmtBezel.style.setProperty("--bezel-top", s.top);
  gmtBezel.style.setProperty("--bezel-bottom", s.bottom);
  document.documentElement.style.setProperty("--gmt-hand", s.hand);

}


requestAnimationFrame(updateClock);


function getTimePartsInZone(date, timeZone) {
  // Uses built-in Intl (no API) and correctly accounts for DST.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = fmt.formatToParts(date);
  const get = (type) => Number(parts.find(p => p.type === type)?.value ?? 0);

  return {
    h: get("hour"),
    m: get("minute"),
    s: get("second"),
  };
}

function updateGmtHand() {
  const now = new Date();
  const zone = gmtCity.value;

  const { h, m, s } = getTimePartsInZone(now, zone);

  // 24-hour angle
  const hour24 = h + m / 60 + s / 3600;
  const angle = (hour24 / 24) * 360;

  // Position the GMT hand
  gmtHand.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;

  // Readout (city local time)
  const ampm = useAmPm?.checked;
  let displayHour = h;
  let suffix = "";

  if (ampm) {
    suffix = h >= 12 ? " PM" : " AM";
    displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
  }

  gmtReadout.textContent = `${pad2(displayHour)}:${pad2(m)}:${pad2(s)}${suffix}`;
  gmtSubReadout.textContent = `${gmtCity.options[gmtCity.selectedIndex].text} (24h bezel position)`;

  requestAnimationFrame(updateGmtHand);
}

applyBezelStyle(bezelStyle.value);
bezelStyle.addEventListener("change", () => applyBezelStyle(bezelStyle.value));

// Start it
requestAnimationFrame(updateGmtHand);

// If you want an immediate “snap” when changing city:
gmtCity.addEventListener("change", () => {
  // no-op; the RAF loop will reflect it immediately
});

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
  const name = phaseNameFromAge(age, synodicMonth);

  return { phase, age, illum, name };
}

function phaseNameFromAge(age, synodicMonth) {
  // Age in days since new moon
  const newMoon = 0;
  const firstQuarter = synodicMonth * 0.25; // ~7.38
  const fullMoon = synodicMonth * 0.5;      // ~14.77
  const lastQuarter = synodicMonth * 0.75;  // ~22.15

  // “Primary phases” should be narrow windows, not huge ranges.
  const windowDays = 1.0; // tighten/loosen if you want (0.7–1.2 are common)

  const within = (x, center) => Math.abs(x - center) <= windowDays;

  if (within(age, newMoon) || within(age, synodicMonth)) return "New Moon";
  if (within(age, firstQuarter)) return "First Quarter";
  if (within(age, fullMoon)) return "Full Moon";
  if (within(age, lastQuarter)) return "Last Quarter";

  if (age < firstQuarter) return "Waxing Crescent";
  if (age < fullMoon) return "Waxing Gibbous";
  if (age < lastQuarter) return "Waning Gibbous";
  return "Waning Crescent";
}

function drawMoonPhase(phase) {
  const w  = moonCanvas.width;
  const h  = moonCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r  = Math.min(w, h) * 0.38;

  ctx.clearRect(0, 0, w, h);

  // Halo
  ctx.beginPath();
  ctx.arc(cx, cy, r + 18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();

  // Base dark disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,10,14,0.9)";
  ctx.fill();

  // Normalize phase
  let p = phase % 1;
  if (p < 0) p += 1;

  // Determine waxing/waning
  const waxing = p <= 0.5;

  // Illumination fraction (0..1), symmetric around full
  const illum = p <= 0.5 ? p * 2 : (1 - p) * 2;

  // For half moon (illum=0.5) ellipse radius = 0
  // For full moon (illum=1)  ellipse radius = 1
  // For new moon (illum=0)  ellipse radius = 1, but we will not show any lit part
  const e = 1 - 2 * Math.abs(illum - 0.5);  // 0 at quarter, 1 at new/full

  // Clip to moon disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // Draw the illuminated part:
  // - Start with the half facing the Sun (right for waxing, left for waning).
  // - Use an ellipse inside that half to trim the shape for crescents/gibbous.
  ctx.beginPath();

  if (waxing) {
    // Right side lit
    // Start at top center, go around right semicircle, then back with an ellipse
    ctx.moveTo(cx, cy - r);
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false); // right half of big circle
    ctx.ellipse(cx, cy, r * e, r, 0, Math.PI / 2, -Math.PI / 2, true);
  } else {
    // Left side lit
    ctx.moveTo(cx, cy - r);
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true); // left half of big circle
    ctx.ellipse(cx, cy, r * e, r, 0, Math.PI / 2, -Math.PI / 2, false);
  }

  ctx.closePath();

  // If illumination is essentially zero, skip filling (keep dark)
  if (illum > 0.01) {
    ctx.fillStyle = "rgba(240,243,248,0.95)";
    ctx.fill();
  }

  ctx.restore();

  // Rim highlight
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
}


let moonTimer = null;

function updateMoon() {
  const now = new Date();
  const info = getMoonPhaseInfo(now);

  moonName.textContent = info.name;
  moonIllum.textContent = Math.round(info.illum * 100);
  moonAge.textContent = info.age.toFixed(2);

  drawMoonPhase(info.phase);   // <-- use phase (0..1)
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
