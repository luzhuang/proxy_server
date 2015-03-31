var net = require('net');
var http = require('http');
var zlib = require('zlib');
var router;
function buffer_to_ipv4(buffer){
	var ipv4 = "";
	for (var i=0,l=buffer.length;i<l;i++){
		ipv4 += "."+buffer[i];
	}
	ipv4 = ipv4.substr(1);
	return ipv4;
}
function auth(buffer,socket){
	var ver = buffer[0],
	nMethods = buffer[1];
	var methods = buffer.slice(2,2+nMethods);
	if (ver != 5) {
		return false;
	}
	var res = Buffer.concat([new Buffer([0x05]),methods]);
	socket.write(res);
	return true;
}
function connect(buffer,socket){
	var ver = buffer[0],
		cmd = buffer[1],
		atyp = buffer[3],
		host,port,atpe,state,res;
	if (ver != 5) {
		state = false;
	}
	switch (atyp) {
		case 1:
			// console.log('IPV4');
			host = buffer_to_ipv4(buffer.slice(4,8));
			port = buffer.slice(8).readUInt16BE(0);
			res = Buffer.concat([new Buffer([0x05,0x00,0x00,0x01]),buffer_to_ipv4(buffer.slice(4,8)),buffer.slice(8)]);
			state = true;
			break;
		case 3:
			// console.log('DOMAINNAME');
			var length = buffer[4];
			host = buffer.slice(5,5+length).toString();
			port = buffer.slice(5+length).readUInt16BE(0);
			res=Buffer.concat([new Buffer([0x05,0x00,0x00,0x03,length]),buffer.slice(5,5+length),buffer.slice(5+length)]);
			state = true;
			break;
		case 4:
			// console.log('IPV6')
			var IPv6 = buffer.slice(4,20);
			console.log('not support now');
			break;
		default:
			console.log('not support now');
	}
	socket.write(res);
	return {state:state,host:host,port:port};
}
function createSocks5Server(proxy_port){
	net.createServer(function (socket) {
		var isAuth = false,
			isConnected = false,
			host,port;
		socket.on('data', function (chunk) {
			if (chunk.length == 3 && !isAuth) {
				isAuth = auth(chunk,socket);
				return;
			}
			if (isAuth && !isConnected) {
				var connect_inform = connect(chunk,socket);
				isConnected = connect_inform.state;
				host = connect_inform.host;
				port = connect_inform.port;
				return;
			}
			if (isConnected && host && port) {
				socket.removeAllListeners('data');
				if (router) {
					for (var filter in router) {
						if (host.match(new RegExp(filter))) {
							var nhost = router[filter].split(":")[0],
								nport = router[filter].split(":")[1];
							if (nhost && net.isIP(nhost)) {
								if (nhost != host) {
									console.log('host:',host,'=>',nhost);
								} 
								host = nhost;
								if (nport) {
									if (nport != port) {
										console.log('port:',port,'=>',nport);
									}
									port = nport;
								}
							}
						}
					}
				}

				getPort(function(p){
					var port = p;
					function changeData(){
						var server = net.createConnection(port,'127.0.0.1');
						server.on('data', function(data){ client.write(data); });
						client.on('data', function(data){ server.write(data); });
						if (req.method == 'CONNECT') {
						    client.write(new Buffer("HTTP/1.1 200 Connection established\r\n\r\n"));
						}else {
						    server.write(buffer);
						}
					}
					if (req.port == 443) {
						https_server.createServer(port,req.host,req.port,changeData);
					}else{
						http_server.createServer(port,req.host,req.port,changeData);
					}
				});
				console.log(host,':',port);
				var server = net.createConnection(port,host);
				server.on('data', function(data){ socket.write(data); });
				socket.on('data', function(data){ server.write(data); });
				server.write(chunk);
			}
		});
	}).listen(proxy_port);
}

function setRouter(router_json) {
	router = router_json;
	return true;
}

module.exports.createSocks5Server = createSocks5Server;
module.exports.setRouter = setRouter;