var cluster = require('cluster');
var http = require('http');
var fs = require('fs');
var numCPUs = require('os').cpus().length;
var net = require('net');
  
http.createServer(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
    if (cluster.isMaster){
      cluster.fork();
    }else{
      // fs.writeFile('message.txt','hello',function(err){});
      console.log(1);
    }
  }).listen(8000);
