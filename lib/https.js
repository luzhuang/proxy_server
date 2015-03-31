var https = require('https');
	url = require('url'),
	fs = require('fs'),
	tls = require('tls'),
	certMgr = require('./certMgr');

function SNI(servername,cb){
	console.log('------');
	var ctx = tls.createSecureContext({
		key : fs.readFileSync(certDir+servername+'.key'),
		cert: fs.readFileSync(certDir+servername+'.crt')
	});
	cb(null,ctx);
}

function createServer(proxy_port,host,port,cb){
	if (!host)
		return;
	certMgr.getCert(host,function(keyContent,certContent){
		var options = {
			SNICallBack : SNI,
			key : keyContent,
		    cert: certContent
		}	

		https.createServer(options,function(req,res){
			var info = url.parse(req.url, true);
			// console.log(host,info.path);
			var options = {
				'host': host,
		        'hostname': info.hostname || req.headers.host || host,
			    'port': port,
			    'method': req.method,
			    'path': info.path,
		     	'headers': req.headers
			}
			var server = https.request(options,function(pres){
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
	}); 
}


module.exports.createServer = createServer;

