const os = require('os');

function getServerIp() {
  if (process.env.TEA_CAST_SERVER_IP) {
    return process.env.TEA_CAST_SERVER_IP;
  }

  const en0 = os.networkInterfaces()['en0'];
  if (en0) {
    return en0.filter(int => int.family === 'IPv4').map(int => int.address);
  }

  return '';
}

module.exports = getServerIp();
