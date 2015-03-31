var http = require('http'),
     numCPUs = require('os').cpus().length;
     cp = require('child_process'), 
     net = require('net');
 var workers = [];
 for (var i = 0; i < numCPUs; i++) {
     workers.push(cp.fork('app.js', ['normal']));
 }
 
 net.createServer(function(s) {
     s.pause();
     var worker = worker.shift();
     worker.send('c',s);
     workers.push(worker);
 }).listen(8000);