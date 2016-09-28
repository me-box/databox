app-list
	div.mdl-spinner(if="{!loaded}")
	ul.mdl-list
		li.mdl-list__item.mdl-list__item--two-line(each="{ apps }")
			a.mdl-list__item-primary-content(href="{ Ports.length > 0 ? Names[0] + '/' : null }")
				i.material-icons.mdl-list__item-icon
					| developer_board
				span
					| { Names[0] }
				span.mdl-list__item-sub-title
					| { Status }
			span.mdl-list__item-secondary-content
				a.mdl-list__item-secondary-action(onclick="{ parent.uninstall }")
					i.material-icons
						| close
	script.
		reload(message)
		{
			if(message != null)
			{
				console.log(message.status + " " + message.from);
			}
			$.get("/list-containers", this.reloaded);
		}

		reloaded(data)
		{
			this.apps = JSON.parse(data);
			this.loaded = true;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		uninstall(e)
		{
			var app = e.item;
			$.post("/uninstall", {"id": app.Id}, function (data) {
				console.log(data);
			});
		}

		this.loaded = false;
		var socket = io.connect(window.location.protocol + '//' + window.location.host);
		socket.on('docker-connect', this.reload);
		socket.on('docker-disconnect', function () {
			loaded = false;
			console.log('disconnect');
		});
		//socket.on('docker-_message', function (message) {
		//	console.log(message);
		//});
		socket.on('docker-create', this.reload);
		socket.on('docker-start', this.reload);
		socket.on('docker-stop', this.reload);
		socket.on('docker-die', this.reload);
		socket.on('docker-destroy', this.reload);
		socket.on('echo', function (data) { console.log(data); });
		socket.emit('echo', 'echo');