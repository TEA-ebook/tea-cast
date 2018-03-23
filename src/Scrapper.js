class Scrapper {

  constructor(config, browser, scrapListener) {
    this.config = config;
    this.browser = browser;
    this.scrapListener = scrapListener;
  }

  start() {
    this.scrap();
    this.scrapHandler = setInterval(this.scrap.bind(this), this.config.refreshInterval);
  }

  async navigation(page) {

  }

  async scrap() {
    this.browser.requestPageScrap(this.config, this.navigation.bind(this), this.scrapListener);
  }

  stop() {
    if (this.scrapHandler) {
      clearInterval(this.scrapHandler);
      this.scrapHandler = null;
    }
  }
}

module.exports = Scrapper;
