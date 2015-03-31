var http = require('http');
var url = require('url');

function createServer(proxy_port,host,port,cb){
	http.createServer(function(req,res){
		var info = url.parse(req.url, true);
		var options = {
			'host': host,
	        'hostname': info.hostname || req.headers.host,
		    'port': port,
		    'method': req.method,
		    'path': info.path,
	     	'headers': req.headers
		}
		var server = http.request(options,function(pres){
			res.writeHead(pres.statusCode,pres.headers);
			pres.on('data',function(data){
				res.write(data);
			});
			pres.on('end',function(){
				res.end();
			});
		});
		req.on('data',function(data){
			server.write(data);
		});
		req.on('end',function(){
			server.end();
		});
	}).listen(proxy_port);
	cb(proxy_port);
}
module.exports.createServer = createServer;