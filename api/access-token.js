const { forward } = require('../lib/proxy');

module.exports = (req, res) => forward(req, res, 'token', 'https://github.com/login/oauth/access_token');
