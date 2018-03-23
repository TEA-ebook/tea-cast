const Scrapper = require('./Scrapper.js');

class GrafanaScrapper extends Scrapper {

  constructor(config, browser, scrapListener) {
    super(config, browser, scrapListener);
  }

  async navigation(page) {
    const onLoginPage = await page.$('[name="username"]');
    if (onLoginPage) {
      await page.type('[name="username"]', this.config.login);
      await page.type('[name="password"]', this.config.password);
      await page.click('[type="submit"]');

      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }

    if (await page.$('body.page-kiosk-mode') === null) {
      await page.type('body', 'd');
      await page.type('body', 'k');
    }
  }
}

module.exports = GrafanaScrapper;
