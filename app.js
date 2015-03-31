var http = require('http'),
     cp = require('child_process'),
     net = require('net');

 var server = http.createServer(function(req,res){
     res.writeHead(200, {"Content-Type": "text/plain",         "Connection": "close"});
     res.end("hello, world");
 });
 
 console.log("webServer started on " + process.pid);
 process.on("message", function(msg,socket) {
     process.nextTick(function(){
         if(msg == 'c' && socket) {
             socket.readable = socket.writable = true;
             socket.resume();
             server.connections++;
             socket.server = server;
             server.emit("connection", socket);
             socket.emit("connect");
         }
     });
 });
              