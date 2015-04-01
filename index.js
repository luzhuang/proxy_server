var test = require('./lib/server.js');
// var test = require('./lib/socks5.js');

test.setConfig({
	http_server_port : 8888,
	https_server_port : 8889,
});
test.createProxyServer(8102);
console.log(test.getCAPath());