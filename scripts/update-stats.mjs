import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "dsa-stats.json");
const outputPath = path.join(rootDir, "assets", "output", "dsa-stats.svg");

const USERNAME = process.env.CODOLIO_USERNAME || "abhinavpuri";

// Fallback / cached data loader with BOM stripping
function loadCachedStats() {
  if (fs.existsSync(dataPath)) {
    try {
      const raw = fs.readFileSync(dataPath, "utf-8").replace(/^\uFEFF/, "");
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Warning: Could not parse cached stats.json, using defaults.");
    }
  }
  return {
    username: USERNAME,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalQuestions: 549,
      totalContests: 3,
      awards: 4,
    },
  };
}

// Scrape live stats from Codolio
async function scrapeLiveStats() {
  let puppeteer;
  const possibleModules = [
    "puppeteer",
    "puppeteer-core",
    path.resolve(rootDir, "node_modules", "puppeteer"),
    path.resolve(rootDir, "node_modules", "puppeteer-core"),
    "D:\\Workplace\\DevCore\\Clone\\dsa-stats-github-readme\\node_modules\\puppeteer",
    "D:\\Workplace\\DevCore\\Clone\\dsa-stats-github-readme\\node_modules\\puppeteer-core",
  ];

  for (const mod of possibleModules) {
    try {
      const m = await import(mod);
      puppeteer = m.default || m;
      if (puppeteer) break;
    } catch (e) {
      try {
        puppeteer = require(mod);
        if (puppeteer) break;
      } catch (err) {}
    }
  }

  if (!puppeteer) {
    console.warn("Puppeteer not found, using cached data.");
    return null;
  }

  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  };

  if (process.platform === "win32") {
    const chromePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ];
    for (const p of chromePaths) {
      if (fs.existsSync(p)) {
        launchOptions.executablePath = p;
        break;
      }
    }
  }

  console.log(`Connecting to Codolio for @${USERNAME}...`);
  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const targetUrl = `https://codolio.com/profile/${USERNAME}`;
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    let totalQuestions = null;
    let totalContests = null;
    let awards = null;

    try {
      await page.waitForSelector("#total_questions", { timeout: 8000 });
      const text = await page.$eval("#total_questions", (el) => el.textContent || "");
      const match = text.match(/\d+/);
      if (match) totalQuestions = parseInt(match[0], 10);
    } catch (e) {
      console.warn("Warning: '#total_questions' selector not found.");
    }

    try {
      await page.waitForSelector("#contest_description span", { timeout: 8000 });
      const text = await page.$eval("#contest_description span", (el) => el.textContent || "");
      const match = text.match(/\d+/);
      if (match) totalContests = parseInt(match[0], 10);
    } catch (e) {
      console.warn("Warning: '#contest_description span' selector not found.");
    }

    try {
      await page.waitForSelector("#badges div span", { timeout: 8000 });
      const text = await page.$eval("#badges div span", (el) => el.textContent || "");
      const match = text.match(/\d+/);
      if (match) awards = parseInt(match[0], 10);
    } catch (e) {
      console.warn("Warning: '#badges div span' selector not found.");
    }

    return { totalQuestions, totalContests, awards };
  } finally {
    await browser.close();
  }
}

// Generate the Clean Icon-Free Minimal SVG Card
function generateSVG(data) {
  const { username, stats } = data;
  const questions = stats.totalQuestions ?? 0;
  const contests = stats.totalContests ?? 0;
  const badges = stats.awards ?? 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 150" width="520" height="150" fill="none" role="img" aria-labelledby="cardTitle cardDesc">
  <title id="cardTitle">${username}'s DSA &amp; Problem Solving Stats</title>
  <desc id="cardDesc">Total Questions Solved: ${questions}, Contests: ${contests}, Awards: ${badges}</desc>

  <style>
    .font-base {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, 'Helvetica Neue', sans-serif;
    }
    .fade-in {
      animation: fadeIn 0.8s ease-in-out forwards;
    }
    .stagger-1 { opacity: 0; animation: fadeIn 0.5s ease-in-out 0.05s forwards; }
    .stagger-2 { opacity: 0; animation: fadeIn 0.5s ease-in-out 0.15s forwards; }
    .stagger-3 { opacity: 0; animation: fadeIn 0.5s ease-in-out 0.25s forwards; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .card-title {
      font-size: 17px;
      font-weight: 700;
      fill: #58a6ff;
      letter-spacing: -0.2px;
    }
    .stat-number {
      font-weight: 800;
      font-size: 30px;
      fill: #f0f6fc;
      letter-spacing: -0.5px;
      text-anchor: middle;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      fill: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-anchor: middle;
    }
    .tile-box {
      fill: #161b22;
      stroke: #30363d;
      stroke-width: 1;
    }
  </style>

  <!-- Clean Dark Background Border (Matching GitHub Dark Theme) -->
  <rect x="0.5" y="0.5" width="519" height="149" rx="8" fill="#0d1117" stroke="#30363d" stroke-width="1" />

  <!-- Title Only -->
  <g class="fade-in font-base" transform="translate(25, 32)">
    <text x="0" y="0" class="card-title">DSA &amp; Problem Solving Stats</text>
  </g>

  <!-- Tile 1: Questions Solved -->
  <g class="stagger-1 font-base" transform="translate(25, 48)">
    <rect x="0" y="0" width="146" height="80" rx="6" class="tile-box" />
    <text x="73" y="44" class="stat-number">${questions}</text>
    <text x="73" y="63" class="stat-label">Problems Solved</text>
  </g>

  <!-- Tile 2: Contests Participated -->
  <g class="stagger-2 font-base" transform="translate(187, 48)">
    <rect x="0" y="0" width="146" height="80" rx="6" class="tile-box" />
    <text x="73" y="44" class="stat-number">${contests}</text>
    <text x="73" y="63" class="stat-label">Contests Attended</text>
  </g>

  <!-- Tile 3: Badges Earned -->
  <g class="stagger-3 font-base" transform="translate(349, 48)">
    <rect x="0" y="0" width="146" height="80" rx="6" class="tile-box" />
    <text x="73" y="44" class="stat-number">${badges}</text>
    <text x="73" y="63" class="stat-label">Badges &amp; Honors</text>
  </g>
</svg>`;
}

async function main() {
  const isGenerateOnly = process.argv.includes("--generate-only");
  const cachedData = loadCachedStats();

  let finalStats = { ...cachedData.stats };
  let updatedTimestamp = cachedData.lastUpdated;

  if (!isGenerateOnly) {
    try {
      const liveStats = await scrapeLiveStats();
      if (liveStats) {
        let changed = false;

        if (typeof liveStats.totalQuestions === "number" && liveStats.totalQuestions > 0) {
          finalStats.totalQuestions = liveStats.totalQuestions;
          changed = true;
        } else if (liveStats.totalQuestions === null) {
          console.log("Using cached totalQuestions:", finalStats.totalQuestions);
        }

        if (typeof liveStats.totalContests === "number" && liveStats.totalContests >= 0) {
          finalStats.totalContests = liveStats.totalContests;
          changed = true;
        }

        if (typeof liveStats.awards === "number" && liveStats.awards >= 0) {
          finalStats.awards = liveStats.awards;
          changed = true;
        }

        if (changed) {
          updatedTimestamp = new Date().toISOString();
        }
      }
    } catch (e) {
      console.error("Scraping encounter error, falling back to cache:", e.message);
    }
  }

  const payload = {
    username: USERNAME,
    lastUpdated: updatedTimestamp,
    stats: finalStats,
  };

  // 1. Save data snapshot
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log("Updated data cache at:", dataPath);

  // 2. Generate and write SVG card
  const svg = generateSVG(payload);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, svg, "utf-8");
  console.log("Generated SVG card at:", outputPath);
  console.log("Summary:", payload.stats);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
