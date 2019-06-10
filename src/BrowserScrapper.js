const puppeteer = require('puppeteer');

class BrowserScrapper {

  constructor(serverPath) {
    this.debug = false;
    this.outputPath = 'public/screenshots/';
    this.requests = [];
    this.processing = false;

    this.serverPath = serverPath;
  }

  async start() {
    console.log(`Starting browser`);

    const puppeteerOptions = {headless: !this.debug, ignoreHTTPSErrors: true};
    if (process.env.CONTAINER) {
      puppeteerOptions['args'] = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
    }
    if (process.env.CHROMIUM_PATH) {
      puppeteerOptions['executablePath'] = process.env.CHROMIUM_PATH;
    }

    this.browser = await puppeteer.launch(puppeteerOptions);

    setInterval(() => this.processQueue(), 500);
  }

  async requestPageScrap(config, navigation, onResult) {
    if (this.requests.some(r => r.config.device === config.device)) {
      console.log('[Browser] Drop scrap request because already in queue', config.device);
      return;
    }
    this.requests.push({
      config,
      navigation,
      onResult
    });
  }

  processQueue() {
    if (this.processing === true) {
      return;
    }
    if (this.requests.length === 0) {
      return;
    }
    this.processRequest(this.requests.shift())
  }

  async processRequest({config, navigation, onResult}) {
    console.log('[Browser] Processing request', config.device);
    this.processing = true;

    try {
      const page = await this.browser.newPage();
      await page.goto(config.url, {waitUntil: 'networkidle0'});

      await navigation(page);

      const imageUrl = await this.scrap(page, config.device);
      onResult(imageUrl);

      await page.close();
    } catch (error) {
      console.log(`[Browser] Error processing request on ${config.device}`, error);
    }

    this.processing = false;
  }

  async scrap(page, device) {
    return page
      .screenshot({path: `${this.outputPath}/${device}.png`})
      .then(() => `${this.serverPath}/${device}.png?time=${Date.now()}`);
  }

  stop() {
    return this.browser.close();
  }
}

module.exports = BrowserScrapper;
