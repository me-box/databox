app-list
	div.mdl-typography--text-center
		div.mdl-spinner.mdl-js-spinner.is-active(if="{!loaded}")
	div(if="{ listSections().length == 0 }")
		| Empty
	div(each="{ section in listSections() }")
		ul.mdl-list
			li.mdl-list__item
				| { section }
			li.mdl-list__item.mdl-list__item--two-line(each="{ listApps(section) }")
				a.mdl-list__item-primary-content(href="{ Ports.length > 0 ? Names[0] + '/' : null }")
					i.material-icons.mdl-list__item-icon
						| { icon }
					span
						| { Names[0].startsWith('/') ? Names[0].substring(1) : Names[0] }
					span.mdl-list__item-sub-title
						| { State }
				span.mdl-list__item-secondary-content
					span.mdl-list__item-secondary-action
						button.mdl-button.mdl-js-button.mdl-button--icon(onclick="{ parent.restartApp }", if="{State != 'installing'}")
							i.material-icons
								| refresh
						button.mdl-button.mdl-js-button.mdl-button--icon(onclick="{ parent.uninstall }", if="{State != 'installing'}")
							i.material-icons
								| close
						div.mdl-spinner.mdl-js-spinner.is-active(if="{State == 'installing'}")
	script.
		this.loaded = false;
		this.listAll = true;
		this.sections = {
			"app": {name: "Apps", icon: "extension"},
			"other": {name: "System", icon: "settings_applications"},
			"driver": {name: "Drivers", icon: "developer_board"}
		};
		this.apps = [];

		reload(message)
		{
			if (message != null) {
				console.log(message.status + " " + message.from);
			}
			$.get("/list-containers", this.reloaded);
		}

		setAppSection(app, sectionName)
		{
			var section = this.sections[sectionName];
			app.Section = section.name;
			app.icon = section.icon;
		}

		reloaded(data)
		{
			this.apps = JSON.parse(data);
			for (var app of this.apps) {
				if (!('Labels' in app)) {
					this.setAppSection(app, "app");
				}
				else if (app.Labels["databox.type"] in this.sections) {
					this.setAppSection(app, app.Labels["databox.type"]);
				}
				else {
					this.setAppSection(app, "other");
				}
			}
			this.apps.sort(function (a, b) {
				var nameA = a.Names[0].toUpperCase(); // ignore upper and lowercase
				var nameB = b.Names[0].toUpperCase(); // ignore upper and lowercase
				return nameA.localeCompare(nameB);
			});
			this.loaded = true;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		restartApp(e)
		{
			var app = e.item;
			$.post("/restart", {"id": app.Id}, function (data) {
				console.log(data);
			});
		}

		listSections()
		{
			var sectionList = [];
			for (var name in this.sections)
			{
				var section = this.sections[name].name;
				if (this.listAll || section === "Apps") {
					for (var app of this.apps) {
						if (app.Section === section) {
							sectionList.push(section);
							break;
						}
					}
				}
			}
			return sectionList;
		}

		listApps(section)
		{
			return this.apps.filter(function (value) {
				return value.Section === section;
			});
		}

		uninstall(e)
		{
			var app = e.item;
			$.post("/uninstall", {"id": app.Id}, function (data) {
				console.log(data);
			});
		}

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
		socket.on('echo', function (data) {
			console.log(data);
		});
		socket.emit('echo', 'echo');