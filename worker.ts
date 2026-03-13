/**
 * LinkedIn Search-Only Worker - Stealth & Cloud-Ready
 * 
 * This worker ONLY searches and saves post links - NO auto-commenting.
 * Features:
 * - Advanced stealth configuration for bot detection avoidance
 * - Human-like behavior patterns (random delays, scrolling)
 * - CAPTCHA detection and supervisor-level self-healing
 * - HTTP Health Check server for Cloud (Render) compatibility
 */

import 'dotenv/config';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { PrismaClient } from '@prisma/client';
import http from 'http';
import {
  setUserContext,
  setApiBaseUrl,
  broadcastStatus,
  broadcastAction,
  broadcastLog,
  broadcastError,
  broadcastScreenshot
} from './lib/worker-broadcast';

const prisma = new PrismaClient();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface WorkerSettings {
  userId: string;
  linkedinSessionCookie: string;
  platformUrl: string;
  minLikes: number;
  maxLikes: number;
  minComments: number;
  maxComments: number;
  systemActive: boolean;
  searchOnlyMode: boolean;
  workHoursOnly: boolean;
  workHoursStart: number;
  workHoursEnd: number;
  skipWeekends: boolean;
  maxSearchesPerHour: number;
  maxSearchesPerDay: number;
  minDelayBetweenSearchesMinutes: number;
  maxKeywordsPerCycle: number;
}

interface KeywordData {
  id: string;
  keyword: string;
}

interface PostCandidate {
  url: string;
  author?: string;
  preview?: string;
  likes: number;
  comments: number;
}

// ============================================================================
// WORKER STATE
// ============================================================================

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;
let isRunning = false;
let currentUserId: string | null = null;
let currentSessionCookie: string | null = null;
let isAuthenticated = false;
let lastBrowserRestart = Date.now();

// ============================================================================
// DASHBOARD LOG MIRRORING
// ============================================================================

let dashboardLoggingEnabled = false;
const logBuffer: Array<{ level: 'info' | 'warn' | 'error'; message: string }> = [];
const MAX_BUFFERED_LOGS = 200;

function bufferLog(level: 'info' | 'warn' | 'error', message: string) {
  if (logBuffer.length >= MAX_BUFFERED_LOGS) logBuffer.shift();
  logBuffer.push({ level, message });
}

async function flushBufferedLogsToDashboard() {
  if (!dashboardLoggingEnabled) return;
  while (logBuffer.length > 0) {
    const item = logBuffer.shift();
    if (!item) break;
    await broadcastLog(item.message, item.level).catch(() => {});
  }
}

function enableDashboardConsoleMirroring() {
  if (dashboardLoggingEnabled) return;
  dashboardLoggingEnabled = true;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.log = (...args: any[]) => {
    originalLog(...args);
    try {
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      bufferLog('info', msg);
      void flushBufferedLogsToDashboard();
    } catch {}
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    try {
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      bufferLog('warn', msg);
      void flushBufferedLogsToDashboard();
    } catch {}
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    try {
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      bufferLog('error', msg);
      void flushBufferedLogsToDashboard();
    } catch {}
  };
}

// ============================================================================
// MAIN WORKER LOOP
// ============================================================================

async function workerLoop() {
  console.log('\n🔍 LinkedIn Search-Only Worker - Starting...\n');
  console.log('📋 Mode: Search and save links ONLY (no auto-commenting)\n');

  try {
    // Clear stale activity flags on startup
    await prisma.settings.updateMany({
      data: { systemActive: false },
    });
    console.log('🧹 Mode Switch: Resetting systemActive for safety. Please click START on dashboard to begin searches.\n');
  } catch (err: any) {
    console.warn('⚠️ Warning: Failed to reset activity flags on startup:', err.message);
  }

  await broadcastStatus('READY', { message: 'Search-only worker initialized and waiting for task' });

  while (true) {
    // Self-healing browser restart
    const browserAgeHours = (Date.now() - lastBrowserRestart) / (1000 * 60 * 60);
    if (browserAgeHours > 6) {
      console.log(`\n🔄 Periodic browser restart (Age: ${Math.round(browserAgeHours)}h)...\n`);
      await cleanup().catch(() => {});
      lastBrowserRestart = Date.now();
    }

    try {
      const settings = await getActiveUserSettings();

      if (!settings || !settings.systemActive) {
        if (isRunning) {
          console.log('⏸️  No active user or system stopped. Entering idle mode...\n');
          await broadcastStatus('IDLE', { message: 'Waiting for system activation' });
          await cleanup();
        }
        await sleep(5000);
        continue;
      }

      // IP / User Context
      setUserContext(settings.userId);
      if (settings.platformUrl) setApiBaseUrl(settings.platformUrl);
      enableDashboardConsoleMirroring();

      // Browser initialization
      if (!browser || currentUserId !== settings.userId || currentSessionCookie !== settings.linkedinSessionCookie) {
        if (browser) await cleanup();
        
        currentUserId = settings.userId;
        currentSessionCookie = settings.linkedinSessionCookie;
        
        await initializeBrowser();
        
        const authenticated = await authenticateLinkedIn(settings.linkedinSessionCookie);
        if (!authenticated) {
          await broadcastError('LinkedIn authentication failed. Check your li_at session cookie.');
          await sleep(30000);
          continue;
        }
        
        isAuthenticated = true;
      }

      // Check Limits & Timing
      if (settings.workHoursOnly && !isWithinWorkHours(settings)) {
        await broadcastStatus('WAITING_FOR_WORK_HOURS');
        await sleep(300000);
        continue;
      }

      const searchesToday = await getSearchCountInPeriod(settings.userId, 'day');
      if (searchesToday >= settings.maxSearchesPerDay) {
        await broadcastStatus('DAILY_LIMIT_REACHED');
        await sleep(3600000);
        continue;
      }

      // Keyword selection
      const keywords = await getActiveKeywords(settings.userId);
      if (keywords.length === 0) {
        await broadcastLog('No active keywords found.', 'warn');
        await sleep(10000);
        continue;
      }

      console.log(`📊 Processing ${keywords.length} keywords in this cycle...\n`);

      for (const keyword of keywords) {
        // System Check
        const stillActive = await isSystemStillActive(settings.userId);
        if (!stillActive) break;

        await processKeyword(keyword, settings);
        
        // Random human delay between keywords
        const delayMins = settings.minDelayBetweenSearchesMinutes;
        const delaySecs = randomBetween(delayMins * 60, (delayMins + 5) * 60);
        console.log(`⏱️ Cooling down for ${Math.round(delaySecs / 60)}m to mimic human behavior...\n`);
        await sleep(delaySecs * 1000);
      }

      const cycleDelay = randomBetween(15, 30);
      console.log(`✅ Cycle complete. Sleeping for ${cycleDelay}m.\n`);
      await broadcastStatus('WAITING_FOR_NEXT_CYCLE');
      await sleep(cycleDelay * 60 * 1000);

    } catch (error: any) {
      console.error('❌ Error in worker cycle:', error.message);
      await broadcastError(`Worker error: ${error.message}`);
      await sleep(60000);
    }
  }
}

async function processKeyword(keyword: KeywordData, settings: WorkerSettings) {
  try {
    console.log(`🔍 Searching: "${keyword.keyword}"`);
    await broadcastLog(`Searching: "${keyword.keyword}"`);

    const postsRaw = await searchLinkedInPosts(keyword.keyword);
    // Log search activity
    await prisma.log.create({
      data: { userId: settings.userId, action: 'SEARCH', postUrl: `search:${keyword.keyword}` }
    }).catch(() => {});

    if (postsRaw.length === 0) {
      console.log('⚠️ No posts found.\n');
      return;
    }

    // Filter by reach
    const matches = postsRaw.filter(p => 
      p.likes >= settings.minLikes && 
      p.likes <= settings.maxLikes && 
      p.comments >= settings.minComments && 
      p.comments <= settings.maxComments
    );

    console.log(`📊 Found ${postsRaw.length} posts. ${matches.length} matches reach criteria.\n`);

    // Save matches to DB for manual review/commenting by client
    let savedCount = 0;
    for (const post of matches) {
      const saved = await savePostToDatabase(post, keyword.keyword, settings.userId);
      if (saved) savedCount++;
    }

    await broadcastLog(`Found ${matches.length} posts for "${keyword.keyword}". Saved ${savedCount} new posts.`);
    
  } catch (error: any) {
    console.error(`❌ Keyword processing error:`, error.message);
  }
}

// ============================================================================
// BROWSER & STEALTH
// ============================================================================

async function initializeBrowser() {
  const isHeadless = process.env.HEADLESS !== 'false';
  
  browser = await chromium.launch({
    headless: isHeadless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });

  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  // Stealth script injection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  page = await context.newPage();
  isRunning = true;
  console.log('✅ Stealth browser initialized');
}

async function authenticateLinkedIn(sessionCookie: string): Promise<boolean> {
  if (!page || !context) throw new Error('Browser initialization failed');

  await context.addCookies([{
    name: 'li_at',
    value: sessionCookie,
    domain: '.linkedin.com',
    path: '/',
    secure: true,
    sameSite: 'None'
  }]);

  await humanDelay(2000, 4000);
  await page.goto('https://www.linkedin.com/feed', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await humanDelay(3000, 5000);

  const authenticated = await page.evaluate(() => {
    return !!document.querySelector('.global-nav, nav[aria-label="Primary Navigation"]');
  });

  if (authenticated) {
    console.log('✅ LinkedIn authenticated\n');
    await broadcastScreenshot(page, 'Logged in to LinkedIn');
    return true;
  }
  return false;
}

// ============================================================================
// SEARCH LOGIC
// ============================================================================

async function searchLinkedInPosts(keyword: string): Promise<PostCandidate[]> {
  if (!page) throw new Error('Page not ready');
  
  const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keyword)}&sortBy=date_posted`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});

  // Human-like scrolling loop
  console.log('📜 Gathering search results...');
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await humanDelay(1000, 2000);
    
    // Check for "More results" button
    const moreBtn = await page.$('button[aria-label="See more results"]').catch(() => null);
    if (moreBtn) await moreBtn.click().catch(() => {});
  }

  // Detect CAPTCHA
  const hasCaptcha = await page.evaluate(() => {
    return document.body.innerText.toLowerCase().includes('security check') || 
           document.body.innerText.toLowerCase().includes('verification') ||
           !!document.querySelector('iframe[src*="captcha"]');
  });

  if (hasCaptcha) {
    await broadcastError('CAPTCHA detected during search! Pausing for 15m.');
    await sleep(15 * 60 * 1000);
    throw new Error('CAPTCHA_DETECTED');
  }

  // Extract posts via script injection
  const posts = await page.evaluate(() => {
    const results: any[] = [];
    const containers = document.querySelectorAll('.reusable-search__result-container, li.artdeco-card');
    
    containers.forEach(container => {
      const urnEl = container.querySelector('[data-urn*="activity:"], [data-urn*="ugcPost:"]');
      if (!urnEl) return;
      
      const urn = urnEl.getAttribute('data-urn');
      const url = 'https://www.linkedin.com/feed/update/' + urn;
      
      let likes = 0, comments = 0;
      const text = (container as HTMLElement).innerText.toLowerCase();
      
      const mLike = text.match(/(\d[\d,]*)\s*(reactions?|likes?)/i);
      if (mLike) likes = parseInt(mLike[1].replace(/,/g, ''));
      
      const mComm = text.match(/(\d[\d,]*)\s*comments?/i);
      if (mComm) comments = parseInt(mComm[1].replace(/,/g, ''));
      
      results.push({ url, likes, comments });
    });
    return results;
  });

  return posts || [];
}

// ============================================================================
// UTILS & DB
// ============================================================================

async function savePostToDatabase(post: PostCandidate, keyword: string, userId: string): Promise<boolean> {
  const existing = await prisma.savedPost.findFirst({ where: { userId, postUrl: post.url } });
  if (existing) return false;

  await prisma.savedPost.create({
    data: {
      userId,
      postUrl: post.url,
      likes: post.likes,
      comments: post.comments,
      keyword,
      visited: false,
      postAuthor: 'Unknown',
      postPreview: ''
    }
  });
  return true;
}

function randomBetween(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function humanDelay(min: number, max: number) { await sleep(randomBetween(min, max)); }

function isWithinWorkHours(settings: WorkerSettings): boolean {
  const now = new Date();
  if (settings.skipWeekends && (now.getDay() === 0 || now.getDay() === 6)) return false;
  const hour = now.getHours();
  return hour >= settings.workHoursStart && hour < settings.workHoursEnd;
}

async function getSearchCountInPeriod(userId: string, period: 'hour' | 'day'): Promise<number> {
  const since = new Date();
  period === 'hour' ? since.setHours(since.getHours() - 1) : since.setDate(since.getDate() - 1);
  return await prisma.log.count({ where: { userId, action: 'SEARCH', timestamp: { gte: since } } });
}

async function getActiveUserSettings(): Promise<WorkerSettings | null> {
  const s = await prisma.settings.findFirst({ where: { systemActive: true } });
  if (!s) return null;
  return {
    userId: s.userId,
    linkedinSessionCookie: s.linkedinSessionCookie,
    platformUrl: s.platformUrl,
    minLikes: s.minLikes,
    maxLikes: s.maxLikes,
    minComments: s.minComments,
    maxComments: s.maxComments,
    systemActive: s.systemActive,
    searchOnlyMode: true, // Forced
    workHoursOnly: s.workHoursOnly ?? true,
    workHoursStart: s.workHoursStart ?? 9,
    workHoursEnd: s.workHoursEnd ?? 18,
    skipWeekends: s.skipWeekends ?? true,
    maxSearchesPerHour: s.maxSearchesPerHour ?? 5,
    maxSearchesPerDay: s.maxSearchesPerDay ?? 20,
    minDelayBetweenSearchesMinutes: s.minDelayBetweenSearchesMinutes ?? 5,
    maxKeywordsPerCycle: s.maxKeywordsPerCycle ?? 3
  };
}

async function getActiveKeywords(userId: string): Promise<KeywordData[]> {
  const k = await prisma.keyword.findMany({ where: { userId, active: true } });
  return k.map(item => ({ id: item.id, keyword: item.keyword }));
}

async function isSystemStillActive(userId: string): Promise<boolean> {
  const s = await prisma.settings.findUnique({ where: { userId } });
  return s?.systemActive ?? false;
}

async function cleanup() {
  console.log('🧹 Cleaning context...');
  if (page) await page.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  page = null; context = null; browser = null;
  isRunning = false;
  isAuthenticated = false;
}

// ============================================================================
// SUPERVISOR & HEALTH CHECK (CLOUD READY)
// ============================================================================

async function main() {
  console.log('\n🚀 LinkedIn Search-Only Platform - Initializing Cloud Node...');

  // Render/Cloud Health Check Server
  const port = process.env.PORT || 10000;
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Worker is alive\n');
  }).listen(port, () => {
    console.log(`📡 Health Check Server: Listening on port ${port}`);
  });

  while (true) {
    try {
      await workerLoop();
    } catch (error: any) {
      console.error('\n💥 SUPERVISOR: Recovering from error:', error.message);
      await cleanup().catch(() => {});
      await sleep(30000);
    }
  }
}

main().catch(async (e) => {
  console.error('💥 Fatal crash:', e);
  await cleanup();
  process.exit(1);
});
