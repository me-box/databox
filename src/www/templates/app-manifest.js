
riot.tag2('app-manifest', '<div class="padded">{manifest.description}</div> <div class="padded"> <div>{manifest.author}</div> <div><a href="{manifest.homepage}">{manifest.homepage}</a></div> </div> <div class="mdl-grid"> <div class="mdl-cell mdl-cell--4-col package {transparent: (!required &amp;&amp; !enabled)}" each="{manifest.packages}" onclick="{parent.togglePackage}"> <div class="dark" style="display: flex; align-items: center"> <div class="mdl-typography--title fill padded">{name}</div> <div class="badge material-icons" if="{required || enabled}">check</div> </div> <div class="mdl-color--cyan-800 fill padded">{purpose}</div> <div class="mdl-color--cyan-800 padded">{benefits}</div> <div class="exchange">in exchange for</div> <div class="dark padded">{risks} <div each="{datasource in datasources}">Access to {getDatasourceType(datasource)}</div> </div> <div class="mdl-color--red-700 mdl-typography--text-center padded">{selectedText(this)}</div> </div> </div> <div class="padded" if="{sensors != null &amp;&amp; datastores != null &amp;&amp; manifest != null &amp;&amp; \'datasources\' in manifest &amp;&amp; manifest.datasources.length &gt; 0}"> <div class="padded mdl-color--cyan-800 mdl-typography--subhead mdl-color-text--white">Datasources</div> <ul class="mdl-list"> <li class="mdl-list__item mdl-list__item--two-line" each="{manifest.datasources}" id="{\'datasource_\' + clientid}"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon">input</i><span>{name}</span><span class="mdl-list__item-sub-title">{sensor || ⁗Unbound⁗}</span></span> <ul class="mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect" for="{\'datasource_\' + clientid}"> <li class="mdl-menu__item" each="{getSensors(type)}" onclick="{parent.selectSensor(parent)}">{description}, {location}</li> <li class="mdl-menu__item" disabled if="{getSensors(type).length == 0}">No sensors found</li> </ul> </li> </ul> </div> <button class="mdl-button mdl-button--colored mdl-button--raised" style="float: right" onclick="{installApp}" __disabled="{!isValid()}">Install</button>', '', '', function(opts) {
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

    this.getSensors = function(type) {
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
    }.bind(this)

    this.isValid = function() {
    	if(opts.validate) {
    		for (var datasource of this.manifest.datasources) {
    			if (datasource.hostname == null) {
    				return false;
    			}
    		}
    	}
    	return true;
    }.bind(this)

    this.setManifest = function(data) {
    	this.manifest = data.manifest;
    	if('packages' in this.manifest && this.manifest.packages.length === 1)
    	{
    		this.manifest.packages[0].enabled = true;
    	}
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)

    this.setDatastores = function(data) {
    	this.datastores = data;
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)

    this.setTypes = function(data) {
    	for(var type of data) {
    		this.types[type.description] = {id: type.id, name: type.description}
    	}
    	console.log(JSON.stringify(this.types));
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)

    this.setSensors = function(data) {
    	this.sensors = data;
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)

    this.togglePackage = function(e) {
    	var package = e.item;
    	if (!package.required) {
    		package.enabled = !package.enabled;
    	}
    	return true;
    }.bind(this)

    this.selectSensor = function(source) {
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
    }.bind(this)

    this.getDatasourceType = function(datasource_id) {
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
    }.bind(this)

    this.selectedText = function(item) {
    	if (item.required) {
    		return 'Required';
    	}
    	if (item.enabled) {
    		return 'Disable ' + item.name;
    	}
    	else {
    		return 'Enable ' + item.name;
    	}
    }.bind(this)

    this.installApp = function(e) {
    	$.post("/install", {"sla": JSON.stringify(this.manifest)}, function (data) {
    		console.log(data);
    	});
    	window.location.href = "/";
    }.bind(this)
});