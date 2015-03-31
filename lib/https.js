var https = require('https');
	url = require('url'),
	fs = require('fs'),
	exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    path = require("path");
var certDir = path.join(__dirname,"..","/.certs/"),
	cmdDir = path.join(__dirname,"..","./cert/"),
	cmd_genRoot = path.join(cmdDir,"./gen-rootCA"),
	cmd_genCert = path.join(cmdDir,"./gen-cer");
function createServer(proxy_port,host,port,cb){
	if (!host)
		return;
	var cmd = cmd_genCert + " __host __path".replace(/__host/,host).replace(/__path/,certDir);
	exec(cmd,{ cwd : certDir },function(err,stdout,stderr){
		if (!err) {
			var options = {
				key : fs.readFileSync(certDir+host+'.key'),
			    cert: fs.readFileSync(certDir+host+'.crt')
			}	

			https.createServer(options,function(req,res){
				var info = url.parse(req.url, true);
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
		}else{
			console.log('!!!',err);
		}
	});  
}


module.exports.createServer = createServer;

