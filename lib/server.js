var net = require('net');
var socks5_server = require('./socks5.js');
var socks5_port = 1083;
var req_url,router;
function isPAC(url){
	if (url) {
		return url.substr(1).match(/.pac$/ig)
	}else {
		return false;
	}
}
function createProxyServer(proxy_port){
	net.createServer(function(socket){
		var buffer = new Buffer(0);
		socket.on('data',function(chunk){
			buffer = Buffer.concat([buffer,chunk]);
			if (buffer_find_body(buffer) == -1) return;
			var req = parse_request(buffer);
			if (req === false) return;
			if (isPAC(req.path)){
				console.log('socks5 server start on:',socks5_port);
				if (router) {
					socks5_server.setRouter(router);
				}
				var head = generate_head();
				var body = generate_body();
				socket.write(new Buffer(head));
				socket.write(new Buffer(body));
				socket.end();
				socks5_server.createSocks5Server(socks5_port);
			}else{
				socket.removeAllListeners('data');
				relay_connection(req);
			}
		});

		function relay_connection(req){
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
		    
		    var server = net.createConnection(req.port,req.host);
		    socket.on("data", function(data){ server.write(data); });
		    server.on("data", function(data){ socket.write(data); });

		    if (req.method == 'CONNECT') {
		        socket.write(new Buffer("HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n"));
		    }
		    else {
		        server.write(buffer);
		    }
		}
	}).listen(proxy_port);
}

process.on('uncaughtException', function(err){
    console.log(err);
});

function parse_request(buffer){
    var s = buffer.toString('utf8');
    var method = s.split('\n')[0].match(/^([A-Z]+)\s/)[1];
    if (method == 'CONNECT'){
        var arr = s.match(/^([A-Z]+)\s([^\:\s]+)\:(\d+)\sHTTP\/(\d\.\d)/);
        if (arr && arr[1] && arr[2] && arr[3] && arr[4])
            return { method: arr[1], host:arr[2], port:arr[3],httpVersion:arr[4] };
    }else{
        var arr = s.match(/^([A-Z]+)\s([^\s]+)\sHTTP\/(\d\.\d)/);
        if (arr && arr[1] && arr[2] && arr[3]){
            var host = s.match(/Host\:\s+([^\n\s\r]+)/)[1];
            if (host){
                var _p = host.split(':',2);
                return { method: arr[1], host:_p[0], port:_p[1]?_p[1]:80, path: arr[2],httpVersion:arr[3] };
            }
        }
    }
    return false;
}

function buffer_find_body(buffer){
    for(var i=0,len=buffer.length-3;i<len;i++){
        if (buffer[i] == 0x0d && buffer[i+1] == 0x0a && buffer[i+2] == 0x0d && buffer[i+3] == 0x0a){
            return i+4;
        }
    }
    return -1;
}

function generate_head(){
	var buffer = 'HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nDate: Thu, 26 Mar 2015 05:31:39 GMT\r\nConnection: keep-alive\r\nTransfer-Encoding: chunked\r\n\r\n79\r\n';
	return buffer;
}

function generate_body(){
	var buffer = 'function FindProxyForURL(url, host) { return "SOCKS5 127.0.0.1:'+socks5_port+';SOCKS 127.0.0.1:'+socks5_port+';SOCKS4 127.0.0.1:'+socks5_port+';DIRECT"; }\r\n0\r\n\r\n';
	return buffer;
}

function setRouter(router_json){
	router = router_json;
}

function setSocks5Port(port){
	socks5_port = port
}

module.exports.createProxyServer = createProxyServer;
module.exports.setRouter = setRouter;
module.exports.setSocks5Port = setSocks5Port;