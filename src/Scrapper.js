const puppeteer = require('puppeteer');

class Scrapper {

  constructor(config, serverPath, scrapListener) {
    this.debug = false;
    this.outputPath = 'public/screenshots/';

    this.config = config;
    this.serverPath = serverPath;
    this.scrapListener = scrapListener;
  }

  async start() {
    console.log(`[${this.config.device}] Starting to scrap ${this.config.url}`);

    const browserWSEndpoint = process.env.BROWSER_END_POINT;
    if (browserWSEndpoint) {
      console.log(`[${this.config.device}] Connect to browser at ${browserWSEndpoint}`);
      this.browser = await puppeteer.connect({ browserWSEndpoint, ignoreHTTPSErrors: true });
    } else {
      console.log(`[${this.config.device}] Spawning new browser`);
      
      let puppeteerOptions = { headless: !debug, ignoreHTTPSErrors: true};
      if (process.env.CONTAINER) {
        puppeteerOptions['args'] = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
      }

      this.browser = await puppeteer.launch(puppeteerOptions);
      process.env.BROWSER_END_POINT = this.browser.wsEndpoint();
    }

    this.page = await this.browser.newPage();
    this.page.setViewport(this.config.viewport);

    await this.navigate();

    this.scrap();
    this.scrapHandler = setInterval(this.scrap.bind(this), this.config.refreshInterval);
  }

  async navigate() {

  }

  async scrap() {
    await this.page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    return this.page
      .screenshot({ path: `${this.outputPath}/${this.config.device}.png` })
      .then(() => this.scrapListener(`${this.serverPath}/${this.config.device}.png?time=${Date.now()}`));
  }

  stop() {
    if (this.scrapHandler) {
      clearInterval(this.scrapHandler);
      this.scrapHandler = null;
    }
    return this.page.close();
  }
}

module.exports = Scrapper;
