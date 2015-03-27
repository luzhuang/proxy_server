var net = require('net');

var socket=net.connect({host:'127.0.0.1',port:8102},function(){
	socket.write(new Buffer('GET /q.pac HTTP/1.1\r\nHost: 127.0.0.1:8102\r\nConnection: keep-alive\r\nUser-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.104 Safari/537.36\r\nAccept-Encoding: gzip, deflate\r\n\r\n'));
	socket.on('data',function(chunk){
		console.log(chunk.toString());
	});
});

// socket.on('error',function(e){
// 	console.log(e);
// });

// var https = require('https');
// var options = {
//   hostname: 'www.baidu.com',
//   port: 443,
//   path: '/',
//   method: 'GET'
// };
// var socket = https.request(options,function(res){
// 	res.on('data',function(chunk){
// 		console.log(chunk.toString());
// 	})
// })
// socket.write(new Buffer('CONNECT www.baidu.com:443 HTTP/1.1\r\nHost: www.baidu.com\r\nProxy-Connection: keep-alive\r\nUser-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.104 Safari/537.36'));

// var options = {
//   hostname: 'www.baidu.com',
//   port: 443,
//   path: '/',
//   method: 'GET'
// };
// var http = require('http');
// var socket = http.request(options,function(res){
// 	res.on('data',function(chunk){
// 		console.log(chunk.toString());
// 	})
// })
// socket.write(new Buffer('CONNECT www.baidu.com:443 HTTP/1.1\r\nHost: www.baidu.com\r\nProxy-Connection: keep-alive\r\nUser-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.104 Safari/537.36'));
