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
				riot.mount('#running-app-list', { list: 'running', items: data })
			});
			break;
		case '#all':
			$.post('/list-images', {}, function(data) {
				$('#all .list-group').empty();
				JSON.parse(data).forEach(function(image) {
					var li = $('<button type="button" class="list-group-item"></button>')
					$('<pre></pre>').text(JSON.stringify(image, null, 2)).appendTo(li);
					li.click(function(event) {
						$.post('/launch-app', { repoTag: image.RepoTags[0] }, function(response) {
							alert('App launched: ' + response);
						});
					});
					li.appendTo('#all .list-group');
				});
			});
			break;
		case '#store':
			$.post('/list-store', {}, function(data) {
				$('#store .list-group').empty();
				JSON.parse(data).repositories.forEach(function(repository){
					sanitizedText = $('<div/>')
					var li = $('<li class="list-group-item"></li>');
					$('<p style="display: inline-block; font-weight: bold;"></p>').text(repository).appendTo(li);
					var btn = $('<button type="button" class="btn btn-default" data-loading-text="Pulling..." autocomplete="off" style="float: right;">Pull</button>').appendTo(li);
					btn.click(function(event) {
						var btn = $(this).button('loading');
						$.post('/pull-app', { name: repository }, function(response) {
							alert(response);
							btn.button('reset');
						});
					});
					li.appendTo('#store .list-group');
				});
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
