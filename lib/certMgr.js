var	fs = require('fs'),
	exec = require('child_process').exec,
	spawn = require('child_process').spawn,
	execSync = require('child_process').execSync,
    path = require("path");
var certDir = path.join(__dirname,"..","/.certs/"),
	cmdDir = path.join(__dirname,"..","./cert/"),
	cmd_genRoot = path.join(cmdDir,"./gen-rootCA"),
	cmd_genCert = path.join(cmdDir,"./gen-cer");

if (!fs.existsSync(certDir)) {
	try {
		fs.mkdirSync(certDir,0777); 	
	}catch(e){
		console.log("failed to create cert dir ,please create one by yourself - " + certDir);
	}
}

var rootCert = path.join(certDir,'rootCA.crt');
var rootKey = path.join(certDir,'rootCA.key');

autoTrustCert();

function createRootCA(){
	var cmd = cmd_genRoot+" __path".replace(/__path/,certDir);
	console.log("Generating rootCA ......");
	execSync(cmd,{cwd : certDir});
}

function autoTrustCert(){
	var auto_trust_cmd = "sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain"+" __path".replace(/__path/,rootCert);
	if (!fs.existsSync(rootCert) || !fs.existsSync(rootKey)) {
		createRootCA();
	}
	try{
		console.log('auto trust rootCA');
		execSync(auto_trust_cmd);
	}catch(e){
		console.log("auto trust rootCA failed ,please open .certs and double click rootCA.crt");
	}
}

function createCert(host,callback){
	var cmd = cmd_genCert + " __host __path".replace(/__host/,host).replace(/__path/,certDir);
	if (!fs.existsSync(rootCert) || !fs.existsSync(rootKey)) {
		createRootCA();
		autoTrustCert();
	}else{
		exec(cmd,{ cwd : certDir },function(err,stdout,stderr){
			if (!err) {
				getCert(host,callback);
			}else{
				console.log(e);
			}
		});
	}
}

function getCert(host,callback){
	var keyFile = certDir+host+'.key',
	certFile = certDir+host+'.crt';

	if (!fs.existsSync(keyFile) || !fs.existsSync(certFile)) {
		createCert(host,callback);
	}else{
		var keyContent = fs.readFileSync(keyFile),
		certContent = fs.readFileSync(certFile);

		callback(certDir,keyContent,certContent);
	}
}

function getCA() {
	var caFile = certDir+'rootCA.crt';
	return fs.readFileSync(caFile);
}

module.exports.getCert = getCert;
module.exports.getCA = getCA 