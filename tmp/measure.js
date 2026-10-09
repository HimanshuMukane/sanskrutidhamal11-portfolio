import puppeteer from '/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const viewports = [
  { name: 'desktop-wide', width: 1440, height: 900 },
  { name: 'desktop-standard', width: 1280, height: 800 },
  { name: 'desktop-small', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

async function measure() {
  const browser = await puppeteer.launch({
    executablePath: '/tmp/chrome/linux-155.0.8059.39/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewport(vp);
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    const metrics = await page.evaluate(() => {
      const h2 = document.querySelector('.about-grid h2');
      const intro = document.querySelector('.about-grid div');
      const p1 = intro.querySelector('p:first-child');
      const pLast = intro.querySelector('p:last-child');
      const grid = document.querySelector('.about-grid');

      const h2Rect = h2.getBoundingClientRect();
      const introRect = intro.getBoundingClientRect();
      const p1Rect = p1.getBoundingClientRect();
      const pLastRect = pLast.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();

      const computedH2 = window.getComputedStyle(h2);
      const computedIntro = window.getComputedStyle(intro);

      return {
        gridWidth: gridRect.width,
        h2: {
          width: h2Rect.width,
          height: h2Rect.height,
          top: h2Rect.top,
          bottom: h2Rect.bottom,
          fontSize: computedH2.fontSize,
          lineHeight: computedH2.lineHeight,
        },
        intro: {
          width: introRect.width,
          height: introRect.height,
          top: introRect.top,
          bottom: introRect.bottom,
        },
        textOnlyHeight: pLastRect.bottom - p1Rect.top,
        heightDifference: h2Rect.height - introRect.height,
        topOffset: h2Rect.top - p1Rect.top,
        bottomOffset: h2Rect.bottom - pLastRect.bottom,
      };
    });

    console.log(`\n=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log(`Grid Width: ${metrics.gridWidth.toFixed(1)}px`);
    console.log(`H2: Width=${metrics.h2.width.toFixed(1)}px, Height=${metrics.h2.height.toFixed(1)}px (font: ${metrics.h2.fontSize}, lh: ${metrics.h2.lineHeight})`);
    console.log(`Intro container: Width=${metrics.intro.width.toFixed(1)}px, Height=${metrics.intro.height.toFixed(1)}px`);
    console.log(`Intro text (p1.top to plast.bottom): Height=${metrics.textOnlyHeight.toFixed(1)}px`);
    console.log(`Difference (H2 - Intro container): ${metrics.heightDifference.toFixed(1)}px`);
    console.log(`Top Alignment (H2.top - P1.top): ${metrics.topOffset.toFixed(1)}px`);
    console.log(`Bottom Alignment (H2.bottom - PLast.bottom): ${metrics.bottomOffset.toFixed(1)}px`);
  }

  await browser.close();
}

measure().catch(err => {
  console.error(err);
  process.exit(1);
});
