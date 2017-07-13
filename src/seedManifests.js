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
		}
		setTimeout(get,2000);
	});
}

	wait()
	.then(()=>{
		
			const req = request.defaults({jar: true});
			req.get("http://" + Config.localAppStoreName,(error,response,body)=>{
				if(error) {
					console.log("[seeding manifest] get app store root to log in", error);
					return Promise.reject();
				}
				proms = Config.localAppStoreSeedManifests.map((name)=>{
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
				});
				return Promise.all(proms);
			});
		
	})
	.then(()=>{
		console.log("Done!");
	})
		
	.catch(err => {
		console.log(err);
		const stack = new Error().stack;
		console.log(stack);
	});

