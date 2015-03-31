var test = require('./lib/server.js');
var cluster = require('cluster');

test.createProxyServer(8102);
test.setSocks5Port(1888);
// test.setRouter({".*" : "127.0.0.1:8084"});