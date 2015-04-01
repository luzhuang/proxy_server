var net = require('net');
var http_server = require('./http.js');
var https_server = require('./https.js');
var parse_request = require('./parseRequest.js');
var app = require('express')();
var http_port = 40000;
var https_port = 40001;
var cert_port = 40002;
var router;
function isPAC(url){
	if (url) {
		return url.substr(1).match(/.pac$/ig)
	}else {
		return false;
	}
}
function createProxyServer(proxy_port){
	downloadCertServer();
	console.log("proxy server started on :",proxy_port)
	net.createServer(function(client){
		var buffer = new Buffer(0);
		client.on('data',function(chunk){
			buffer = Buffer.concat([buffer,chunk]);
			if (buffer_find_body(buffer) == -1) return;
			var req = parse_request(buffer);
			if (req === false) return;
			client.removeAllListeners('data');
			relay_connection(req);
		});

		function relay_connection(req){
			console.log(req.method,' ',req.host,':',req.port);
			if (req.host == '127.0.0.1')
				return;
			if (req.method != 'CONNECT'){
		        var _body_pos = buffer_find_body(buffer);
		        if (_body_pos < 0) _body_pos = buffer.length;
		        var header = buffer.slice(0,_body_pos).toString('utf8');
		        header = header.replace(/(proxy\-)?connection\:.+\r\n/ig,'')
		                .replace(/Keep\-Alive\:.+\r\n/i,'')
		                .replace("\r\n",'\r\nConnection: close\r\n');
		        if (req.httpVersion == '1.1'){
		            var url = req.path.replace(/http\:\/\/[^\/]+/,'');
		            if (req.path != url) header = header.replace(req.path,url);
		        }
		        buffer = Buffer.concat([new Buffer(header,'utf8'),buffer.slice(_body_pos)]);
		    }

			if (req.port == 443 || req.method == "CONNECT") {
				changeData(https_port,req);
			}else{
				changeData(http_port,req);
			}
			
			function changeData(port,req){
				var server = net.createConnection(port,'127.0.0.1');
				server.on('data', function(data){ 
					try{
						client.write(data); 	
					}catch(e){
						// console.log(e);
					}
				});
				client.on('data', function(data){ 
					try{
						server.write(data); 	
					}catch(e){
						// console.log(e);
					}
				});
				if (req.method == 'CONNECT') {
				    client.write(new Buffer("HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n"));
				}else {
				    server.write(buffer);
				}
			}
		}
	}).listen(proxy_port);
	
	http_server.createServer(http_port);
	console.log('http server started on :',http_port);
	https_server.createServer(https_port);
	console.log('https server started on :',https_port);

}

function buffer_find_body(buffer){
    for(var i=0,len=buffer.length-3;i<len;i++){
        if (buffer[i] == 0x0d && buffer[i+1] == 0x0a && buffer[i+2] == 0x0d && buffer[i+3] == 0x0a){
            return i+4;
        }
    }
    return -1;
}

function setConfig(config){
	http_port = config.http_server_port;
	https_port = config.https_server_port;
	cert_port = config.download_cert_port;
}

function downloadCertServer(){
	var crtFilePath = ".certs/rootCA.crt";
	app.get("/",function(req,res){
        res.setHeader("Content-Type","application/x-x509-ca-cert");
        res.setHeader("Content-Disposition",'attachment; filename="rootCA.crt"');
        res.end(fs.readFileSync(crtFilePath,{encoding:null}));
    });
    app.listen(cert_port);
    console.log("download_cert_server started on :",cert_port);
}

process.on('uncaughtException', function(err){
    console.log(err);
});

module.exports.createProxyServer = createProxyServer;
module.exports.setConfig  = setConfig;



