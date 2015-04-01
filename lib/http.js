var http = require('http');
var url = require('url');
var zlib = require('zlib');
function createServer(proxy_port,host,port,cb){
	http.createServer(function(req,res){
		var info = url.parse(req.url, true);
		var options = {
			'host': info.host || req.headers.host,
	        'hostname': info.hostname || req.headers.host || host,
		    'port': info.port || 80,
		    'method': req.method,
		    'path': info.path,
	     	'headers': req.headers
		}
		// console.log(options);
		var server = http.request(options,function(pres){
			res.writeHead(pres.statusCode,pres.headers);
			pres.on('data',function(data){
				zlib.gunzip(data,function(err,buffer){
					if (!err) {
						// console.log(buffer.toString('ascii'));
					}
				});
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
}
module.exports.createServer = createServer;