app-manifest
	div.padded
		| {manifest.description}
	div.padded
		div
			| {manifest.author}
		div
			a(href="{manifest.homepage}")
				| {manifest.homepage}
	div.mdl-grid
		div.mdl-cell.mdl-cell--4-col.package(each="{ manifest.packages }", onclick="{ parent.togglePackage }", class="{transparent: (!required && !enabled)}")
			div.dark(style="display: flex; align-items: center")
				div.mdl-typography--title.fill.padded
					| {name}
				div.badge.material-icons(if="{ required || enabled }")
					| check
			div.mdl-color--cyan-800.fill.padded
				| {purpose}
			div.mdl-color--cyan-800.padded
				| {benefits}
			div.exchange
				| in exchange for
			div.dark.padded
				| {risks}
				div(each="{datasource in datasources}")
					| Access to { getDatasourceType(datasource) }
			div.mdl-color--red-700.mdl-typography--text-center.padded
				| {selectedText(this)}
	div.padded(if="{ sensors != null && datastores != null && manifest != null && 'datasources' in manifest}")
		div.padded.mdl-color--cyan-800.mdl-typography--subhead.mdl-color-text--white
			| Datasources
		ul.mdl-list
			li.mdl-list__item.mdl-list__item--two-line(each="{ manifest.datasources }", id="{'datasource_' + clientid}")
				span.mdl-list__item-primary-content
					i.material-icons.mdl-list__item-icon
						| input
					span
						| { name }
					span.mdl-list__item-sub-title
						| { sensor || "Unbound" }
				ul.mdl-menu.mdl-menu--bottom-left.mdl-js-menu.mdl-js-ripple-effect(for="{'datasource_' + clientid}")
					li.mdl-menu__item(each="{ getSensors(type) }", onclick="{ parent.selectSensor(parent)}")
						| { description }, { location }
					li.mdl-menu__item(disabled, if="{ getSensors(type).length == 0 }")
						| No sensors found
	button.mdl-button.mdl-button--colored.mdl-button--raised(style="float: right", onclick="{ installApp }")
		| Install
	script.
		this.manifest = null;
		this.sensors = null;
		this.datastores = null;
		this.typeMapping = {
			"temperature": {id: 1, name: "Temperature"},
			"bulbs": {id: 5, name: "Hue Lights"},
			"temp": {id: 1, name: "Temperature"},
			"huebulb": {id: 5, name: "Hue Lights"},
			"sensorkit": {id: 6, name: "Sensor Kit"},
			"app": {id: 7, name: "App"}
		};
		this.on('mount', function () {
			if (getUrlVars()["test"] == "true") {
				$.get("/test-data/manifest.json", this.setManifest);
			}
			else {
				$.post("http://store.upintheclouds.org/app/get/", {name: window.location.hash.substr(1)}, this.setManifest);
			}
			$.get("/directory/api/datastore", this.setDatastores);
			$.get("/directory/api/sensor", this.setSensors);
		});

		getSensors(type) {
			if (type == null) {
				console.log(type + " == null");
				return this.sensors;
			}
			else {
				var typeObj = this.typeMapping[type];
				if(typeObj != null)
				{
					return this.sensors.filter(function (sensor) {
						return sensor.sensor_type_id === typeObj.id;
					});
				}
				else {
					return this.sensors.filter(function (sensor) {
						return sensor.sensor_type_id === type;
					});
				}
			}
		}

		setManifest(data) {
			this.manifest = data.manifest;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		setDatastores(data) {
			this.datastores = data;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		setSensors(data) {
			this.sensors = data;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		togglePackage(e) {
			var package = e.item;
			if (!package.required) {
				package.enabled = !package.enabled;
			}
			return true;
		}

		function getUrlVars() {
			var vars = [], hash;
			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
			for (var i = 0; i < hashes.length; i++) {
				hash = hashes[i].split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
			}
			return vars;
		}

		selectSensor(source) {
			return function (e) {
				var sensor = e.item;
				var datasource = source._item;
				for (var datastore of this.datastores) {
					if (datastore.id == sensor.datastore_id) {
						datasource.hostname = datastore.hostname;
						datasource.api_url = datastore.api_url;
						datasource.sensor = sensor.description + ", " + sensor.location;
					}
				}
			}
		}

		getDatasourceType(datasource_id) {
			for (datasource of this.manifest.datasources) {
				if (datasource.clientid === datasource_id) {
					var type = this.typeMapping[datasource.type];
					if(type != null)
					{
						return type.name;
					}
					return datasource.type;
				}
			}
			return {"type": "sensor"};
		}

		selectedText(item) {
			if (item.required) {
				return 'Required';
			}
			if (item.enabled) {
				return 'Disable ' + item.name;
			}
			else {
				return 'Enable ' + item.name;
			}
		}

		installApp(e) {
			$.post("/install", {"sla": JSON.stringify(this.manifest)}, function (data) {
				console.log(data);
			});
			window.location.href = "/";
		}
