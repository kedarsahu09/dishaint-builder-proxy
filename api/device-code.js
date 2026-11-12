const { forward } = require('../lib/proxy');

module.exports = (req, res) => forward(req, res, 'device', 'https://github.com/login/device/code');
