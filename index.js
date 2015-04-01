// var test = require('./lib/server.js');
var test = require('./lib/server.js');

test.setConfig({
	http_server_port : 8888,
	https_server_port : 8889,
	download_cert_port : 8890
});
test.createProxyServer(8102);