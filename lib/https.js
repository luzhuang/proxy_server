var https = require('https');
	url = require('url'),
	fs = require('fs'),
	tls = require('tls'),
	certMgr = require('./certMgr');
	zlib = require('zlib');

function createServer(proxy_port){
	function SNI(servername,cb){
		certMgr.getCert(servername,function(certDir,keyContent,certContent){
			var ctx = tls.createSecureContext({
				key : keyContent,
				cert: certContent
			});
			cb(null,ctx);
		}); 
	}
	var options = {
		SNICallback : SNI
	}	

	https.createServer(options,function(req,res){
		var info = url.parse(req.url, true);
		var options = {
			'host': info.host || req.headers.host,
	        'hostname': info.hostname || req.headers.host || host,
		    'port': info.port || 443,
		    'method': req.method,
		    'path': info.path,
	     	'headers': req.headers
		}
		// console.log(options);
		var server = https.request(options,function(pres){
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

