var hostile = require('hostile');

var hosts = [
	'databox-registry.dev',
	'databox-arbiter',
	'databox-store.dev'
];

var p = Promise.resolve();
hosts.forEach((host, i) => {
	p = p.then(() => new Promise((resolve, reject) => {
		// TODO: Are we sure they map to those IPs on Linux? Should precede with docker inspect?
		var ip = process.platform === 'linux' ? '172.17.0.' + (2 + i) : '127.0.0.1';
		hostile.set(ip, host, (err) => err ? reject(err) : resolve());
	}));
});

p
.then(() => console.log('All hosts set successfully'))
.catch((err) => console.error('Setting hosts failed:', err));
