process.setMaxListeners(200);

const conman = require('./container-manager.js');
const Config = require('./config.json');
const httpsHelper = require('./https-helper');
const DATABOX_DEV = process.env.DATABOX_DEV

var containerMangerUIServer = null;

httpsHelper.init()
	.then(() => {

			let proms = Config.localRegistrySeedImages.map((img)=>{
				return conman.updateImage('databoxsystems',img,'local');
			});
			return Promise.all(proms);

	})
	.then(()=>{
		console.log("Done!");
	})
		
	.catch(err => {
		console.log(err);
		const stack = new Error().stack;
		console.log(stack);
	});

