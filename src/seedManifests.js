const Config = require('./config.json');
const request = require('request');
const fs = require('fs');

var containerMangerUIServer = null;

const wait = ()=> { 
	return new Promise((resolve,reject)=>{
		function get () {
			request.get("http://" + Config.localAppStoreName,(error,response,body)=>{
                                if(error) {
                                        console.log("[seeding manifest] waiting for appstore");
                                        setTimeout(get,4000);
                                } else {
					resolve();
				}
			});
			resolve();
		}
		setTimeout(get,2000);
	});
}

const seedFromGithub = (name)=> {
			return new Promise(function(resolve, reject) {
				url = "https://raw.githubusercontent.com/me-box/"+name+"/master/databox-manifest.json"; 
				req.get(url,(error,response,body)=>{
					if(error) {
						console.log("[seeding manifest] Failed to get manifest from" + url, error);
					}
					req.post({
							uri: "http://" + Config.localAppStoreName + "/app/post",
							method: "POST",
							form: {"manifest": body}
							}, (error,response,body) => {
								if(error) {
									console.log("[seeding manifest] Failed to POST manifest " + url, error);
								} 
								resolve();
							});
				});
			});
}

const seedFromDisk = (name) => {
		return new Promise(function(resolve, reject) {
			
			let path = "./"+name+"/databox-manifest.json";
			fs.readFile(path,'utf8', (error,body)=>{
				if(error) {
					console.log("[seeding manifest] Failed to get manifest from " + path, error);
				}
				req.post({
						uri: "http://" + Config.localAppStoreName + "/app/post",
						method: "POST",
						form: {"manifest": body}
						}, (error,response,body) => {
							if(error) {
								console.log("[seeding manifest] Failed to POST manifest " + url, error);
							} 
							resolve();
						});
			});
		});	
}

const req = request.defaults({jar: true});
wait()
.then(()=>{
		return  new Promise(function(resolve, reject) { 
		
			req.get("http://" + Config.localAppStoreName,(error,response,body)=>{
				if(error) {
					console.log("[seeding manifest] get app store root to log in", error);
					return reject();
				}
				
				let proms = []
				if(process.env.DATABOX_DEV == 1) {
					proms = Config.localAppStoreSeedManifests.map(seedFromDisk)
				} else {
					proms = Config.localAppStoreSeedManifests.map(seedFromGithub)
				}
				
				resolve(proms);
			});
		});
})
.then((pArray)=>{
	return Promise.all(pArray);
})
.then(()=>{
	console.log("[seeding manifest] Done");
})
.catch(err => {
	console.log(err);
	const stack = new Error().stack;
	console.log(stack);
});



