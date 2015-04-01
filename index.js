// var test = require('./lib/server.js');
var test = require('./lib/socks5.js');

test.setConfig({
	http_server_port : 8888,
	https_server_port : 8889,
});
test.use(function(req,res){
	console.log(req.url);
	return true;
}).use(function(req,res){
	console.log(req.headers);
	return true;
}).listen(8102);