var net = require('net');
var http_server = require('./http.js');
var https_server = require('./https.js');
var parse_request = require('./parseRequest.js');
var app = require('express')();
var http_port = 40000;
var https_port = 40001;
var cert_port = 40002;
function buffer_to_ipv4(buffer){
	var ipv4 = "";
	for (var i=0,l=buffer.length;i<l;i++){
		ipv4 += "."+buffer[i];
	}
	ipv4 = ipv4.substr(1);
	return ipv4;
}
function auth(buffer,client){
	var ver = buffer[0],
	nMethods = buffer[1];
	var methods = buffer.slice(2,2+nMethods);
	if (ver != 5) {
		return false;
	}
	var res = Buffer.concat([new Buffer([0x05]),methods]);
	client.write(res);
	return true;
}
function connect(buffer,client){
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
	client.write(res);
	return {state:state,host:host,port:port};
}
function createSocks5Server(proxy_port){
	var buffer = new Buffer(0);
	downloadCertServer();
	console.log("socks5 server started on :",proxy_port)
	net.createServer(function (client) {
		var isAuth = false,
			isConnected = false,
			host,port;
		client.on('data', function (chunk) {
			buffer = chunk;
			if (chunk.length == 3 && !isAuth) {
				isAuth = auth(chunk,client);
				return;
			}
			if (isAuth && !isConnected) {
				var connect_inform = connect(chunk,client);
				isConnected = connect_inform.state;
				host = connect_inform.host;
				port = connect_inform.port;
				return;
			}
			if (isConnected && host && port) {
				client.removeAllListeners('data');
				var req = {
					host : host,
					port : port
				};
				relay_connection(req);
			}
		});
		
		function relay_connection(req){
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
				server.write(buffer);
			}
		}
	}).listen(proxy_port);

	http_server.createServer(http_port);
	console.log('http server started on :',http_port);
	https_server.createServer(https_port);
	console.log('https server started on :',https_port);
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

module.exports.createProxyServer = createSocks5Server;
module.exports.setConfig  = setConfig;