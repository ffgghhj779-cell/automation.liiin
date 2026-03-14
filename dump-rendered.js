const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function main() {
  const prisma = new PrismaClient();
  const settings = await prisma.settings.findFirst({
    where: { linkedinSessionCookie: { not: '' } }
  });
  if (!settings) { console.error('No cookie'); return; }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ 
    name: 'li_at', value: settings.linkedinSessionCookie, domain: '.linkedin.com', path: '/' 
  }]);

  const page = await context.newPage();
  console.log('Navigating...');
  await page.goto('https://www.linkedin.com/search/results/content/?keywords=cursor&sortBy=date_posted', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting 10s to ensure React renders...');
  await page.waitForTimeout(10000);
  await page.waitForTimeout(5000); // extra wait for React

  console.log('Extracting main content...');
  try {
    const mainHtml = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.innerHTML : document.body.innerHTML;
    });
    fs.writeFileSync('rendered-main.html', mainHtml);
    console.log('Saved rendered HTML to rendered-main.html');
  } catch(e) { console.error(e); }

  await browser.close();
  await prisma.$disconnect();
}
main();
