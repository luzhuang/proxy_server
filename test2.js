var net = require('net');
var https = require('https');
net.createServer(function(client){
	var buffer = new Buffer(0);
	var host,port;
	client.on('data',function(data){
		buffer = Buffer.concat([buffer,data]);
		var header = data.toString().split(' ');
		client.removeAllListeners('data');
		console.log(data.toString());
		if (header[0] == 'CONNECT'){
			host = header[1].split(':')[0];
			port = header[1].split(':')[1];
		}
		console.log(host,port);
		var server = net.createConnection(port,host);
		server.on('data',function(chunk){ console.log('+',chunk);client.write(chunk); })
		client.on('data',function(chunk) {console.log('-',chunk.toString());server.write(chunk); });
		if (header[0] == 'CONNECT'){
		// 	console.log(1);
			client.write(new Buffer("HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n"));
		}
		// 	console.log(data.toString());
		// 	server.write(data);
		// }
			
		
	});
}).listen(8102);

process.on('uncaughtException', function(err){
    console.log("\nError!!!!");
    console.log(err);
});