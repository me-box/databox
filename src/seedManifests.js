const Config = require('./config.json');
const request = require('request');

var containerMangerUIServer = null;

const wait = ()=> { 
	return new Promise((resolve,reject)=>{
		setTimeout(resolve,7000);
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
				proms = Config.localAppStoreSeedManifests.map((url)=>{
					return new Promise(function(resolve, reject) {
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

