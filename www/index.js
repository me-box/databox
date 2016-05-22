$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	switch($(e.target).attr('href')) {
		case '#running':
			$.post('/list-containers', { all: false }, function(data) {
				data = JSON.parse(data).map(function(container, index) {
					return {
						index: index,
						image: container.Image,
						name: container.Names[0].substring(1),
						info: JSON.stringify(container, null, 2),
						hasUI: container.Ports.length > 0
					};
				});
				riot.mount('running-list', { list: 'running', items: data })
			});
			break;
		case '#all':
			$.post('/list-images', { all: true }, function(data) {
				data = JSON.parse(data).map(function(container, index) {
					return {
						index: index,
						repoTag: container.RepoTags[0],
						//name: container.Names[0].substring(1),
						info: JSON.stringify(container, null, 2),
					};
				});
				riot.mount('all-list', { list: 'all', items: data })
			});
			break;
		case '#store':
			$.post('/list-store', {}, function(data) {
				$('#store .list-group').remove();
				data = JSON.parse(data).map(function(image, index) {
					return {
						index: index,
						name: image.manifest.name,
						poster: image.poster.username,
						info: JSON.stringify(image, null, 2)
					};
				});
				riot.mount('store', { items: data })
			});
			break;
		default:
			break;
	}
});

$(function() {
	function updateStatus() {
		$.post('/get-broker-status', {}, function(status) {
			$('#broker-status').text(status);
		});
	}
	updateStatus();

	$('#broker-status-toggle-button').click(function(event) {
		var btn = $(this).button('loading');
		$.post('/toggle-broker-status', {}, function(status) {
			$('#broker-status').text(status);
			// TODO: Actually make the server message
			setTimeout(checkTwitterSignedIn, 1000);
			btn.button('reset');
		});
	});

	$('#hello-world-launch').click(function(event) {
		$.post('/launch-app', { name: 'databox-hello-world', tag: 'latest' }, function(status) {
			console.log(status);
		});
	});
});

var socket = io.connect(window.location.protocol + '//' + window.location.host);
socket.on('docker-connect', function () {
	console.log('connect');
});
socket.on('docker-disconnect', function () {
	console.log('disconnect');
});
//socket.on('docker-_message', function (message) {
//	console.log(message);
//});
socket.on('docker-create', function (message) {
	console.log(message);
});
socket.on('docker-start', function (message) {
	console.log(message);
});
socket.on('docker-stop', function (message) {
	console.log(message);
});
socket.on('docker-die', function (message) {
	console.log(message);
});
socket.on('docker-destroy', function (message) {
	console.log(message);
});
socket.on('echo', function (data) {
	console.log(data);
});
socket.emit('echo', 'echo');
