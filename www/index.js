$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	switch($(e.target).attr('href')) {
		case '#running':
			$.post('/list-containers', { all: false }, function(data) {
				$('#running .list-group').empty();
				JSON.parse(data).forEach(function(container) {
					var hasUI = container.Ports.length > 0;
					var li = $('<button type="button" class="list-group-item"' + (hasUI ? ' data-toggle="modal" data-target="#app-ui"' : '') + '></button>')
					$('<pre></pre>').text(JSON.stringify(container, null, 2)).appendTo(li);
					li.click(function(event) {
						if (hasUI) {
							$('#app-ui-title').text(container.Image);
							$('#app-ui-iframe').attr('src', container.Names[0] + '/');
						} else {
							alert('This app has no UI');
						}
					});
					li.appendTo('#running .list-group');
				});
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
	function checkTwitterSignedIn() {
		$.get('/broker/twitter/is-signed-in', {}, function(isSignedIn) {
			if (isSignedIn === 'false')
				$('#twitter-sign-in-button').show();
		});
	}
	checkTwitterSignedIn();

	$.post('/list-containers', { all: false }, function(data) {
		$('#running .list-group').empty();
		data = JSON.parse(data);
		for (var i = 0, len = data.length; i < len; ++i) {
			var li = $('<li class="list-group-item"></li>')
			$('<code></code>').text(JSON.stringify(data[i], null, 2)).appendTo(li);
			li.appendTo('#running .list-group');
		}
	});

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
