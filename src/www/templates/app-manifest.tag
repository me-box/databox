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
	div.padded(if="{ sensors != null && datastores != null && manifest != null && 'datasources' in manifest && manifest.datasources.length > 0}")
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
	button.mdl-button.mdl-button--colored.mdl-button--raised(style="float: right", onclick="{ installApp }", disabled="{ !isValid() }")
		| Install
	script.
		this.manifest = null;
		this.sensors = null;
		this.datastores = null;
		this.types = {};
		this.on('mount', function () {
			$.post("/store/app/get/", {name: opts.name}, this.setManifest);
			$.get("/databox-directory/api/datastore", this.setDatastores);
			$.get("/databox-directory/api/sensor", this.setSensors);
			$.get("/databox-directory/api/sensor_type", this.setTypes);
		});

		getSensors(type) {
			if (type == null) {
				console.log(type + " == null");
				return this.sensors;
			}
			else {
				var typeObj = this.types[type];
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

		isValid() {
			if(opts.validate) {
				for (var datasource of this.manifest.datasources) {
					if (datasource.hostname == null) {
						return false;
					}
				}
			}
			return true;
		}


		setManifest(data) {
			this.manifest = data.manifest;
			if('packages' in this.manifest && this.manifest.packages.length === 1)
			{
				this.manifest.packages[0].enabled = true;
			}
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		setDatastores(data) {
			this.datastores = data;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		setTypes(data) {
			for(var type of data) {
				this.types[type.description] = {id: type.id, name: type.description}
			}
			console.log(JSON.stringify(this.types));
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

		selectSensor(source) {
			return function (e) {
				var sensor = e.item;
				var datasource = source._item;
				for (var datastore of this.datastores) {
					if (datastore.id == sensor.datastore_id) {
						datasource.hostname = datastore.hostname;
						datasource.api_url = datastore.api_url;
						datasource.sensor_id = sensor.id;
						datasource.sensor = sensor.description + ", " + sensor.location;
					}
				}
			}
		}

		getDatasourceType(datasource_id) {
			for (datasource of this.manifest.datasources) {
				if (datasource.clientid === datasource_id) {
					var type = this.types[datasource.type];
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
