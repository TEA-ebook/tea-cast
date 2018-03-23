const Scrapper = require('./Scrapper.js');

class LockRedisScrapper extends Scrapper {

  async navigation(page) {
    const onLoginPage = await page.$('[name="_username"]');
    if (onLoginPage) {
      await page.type('[name="_username"]', this.config.login);
      await page.type('[name="_password"]', this.config.password);
      await page.click('[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }

    await page.reload({ waitUntil: 'networkidle0' });
  }
}

module.exports = LockRedisScrapper;
