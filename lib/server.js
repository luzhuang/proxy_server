var net = require('net');
var http_server = require('./http.js');
var https_server = require('./https.js');
var parse_request = require('./parseRequest.js');
var certMgr = require('./certMgr');
var http_port = 40000;
var https_port = 40001;
var handlers = [];

function createProxyServer(proxy_port){
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
			if (req.host == '127.0.0.1')
				return;
			console.log(req.method,' ',req.host,':',req.port);
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
	
	http_server.createServer(http_port,handlers);
	console.log('http server started on :',http_port);
	https_server.createServer(https_port,handlers);
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

function use(func){
	handlers.push(func);
	return this;
}

function setConfig(config){
	http_port = config.http_server_port;
	https_port = config.https_server_port;
}

function getCAPath(){
	return certMgr.getCAPath();
}

process.on('uncaughtException', function(err){
    console.log(err);
});

module.exports.listen = createProxyServer;
module.exports.setConfig  = setConfig;
module.exports.getCAPath = getCAPath;
module.exports.use = use;

