const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:4173/vedanshi/#/project/2_number_guess');
  await page.waitForSelector('.terminal-wrapper');
  
  const heights = await page.evaluate(() => {
     const elements = [
       '.project-details-container',
       '.project-workspace',
       '.editor-section',
       '.execution-section',
       '.code-viewer-container',
       'pre',
       '.execution-panel',
       '.terminal-wrapper',
       '.terminal-container'
     ];
     let result = {};
     for (const sel of elements) {
        const el = document.querySelector(sel);
        if (el) {
           const rect = el.getBoundingClientRect();
           const style = window.getComputedStyle(el);
           result[sel] = { height: rect.height, minHeight: style.minHeight, scrollHeight: el.scrollHeight };
        }
     }
     return result;
  });
  console.log(heights);
  await browser.close();
})();
