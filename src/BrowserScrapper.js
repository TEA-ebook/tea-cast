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

    const openedPages = await this.browser.pages();
    const openedPage = openedPages.filter(page => page.url() === config.url);

    let page;
    if (openedPage.length === 0) {
      page = await this.browser.newPage();
      await page.goto(config.url, {waitUntil: 'networkidle0'});
    } else {
      page = openedPage[0];
      await page.bringToFront();
    }

    await navigation(page);

    const imageUrl = await this.scrap(page, config.device);
    onResult(imageUrl);

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
