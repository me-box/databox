
riot.tag2('databox-manifest', '<header class="mdl-layout__header"> <div class="mdl-layout__header-row"><span class="mdl-layout-title">{opts.manifest.name}</span></div> </header> <main class="mdl-layout__content"> <div>{opts.manifest.description}</div> <div>{opts.manifest.author}</div> <div><a href="{opts.manifest.homepage}">{opts.manifest.homepage}</a></div> <div class="mdl-grid"> <div class="mdl-cell mdl-cell--4-col {transparent: !isEnabled(this)}" each="{opts.manifest.packages}" onclick="{parent.togglePackage}"> <div class="badge material-icons" if="{isEnabled(this)}">check</div> <div class="package_title">{name}</div> <div class="purpose">{purpose}</div> <div class="benefits">{benefits}</div> <div class="exchange">in exchange for</div> <div class="risk">{risk}</div> <div class="required">{selectedText(this)}</div> </div> </div> <div each="{opts.manifest.datasources}"> <div id="{\'datasource_\' + clientid}">{name} = {sensor || ⁗Unbound⁗}</div> <div class="mdl-menu mdl-js-menu mdl-js-ripple-effect" for="{\'datasource_\' + clientid}"> <div class="mdl-menu__item" each="{parent.opts.sensors}" onclick="{parent.selectSensor(parent)}">{description}, {location}</div> </div> </div> <button class="mdl-button" onclick="{installApp(opts.manifest)}">Install</button> </main>', '', 'class="mdl-layout mdl-js-layout mdl-layout--fixed-header"', function(opts) {
    this.togglePackage = function(e) {
    	var package = e.item;
    	if (!package.required) {
    		package.enabled = !package.enabled;
    	}
    	return true;
    }.bind(this)

    this.selectSensor = function(source) {
    	return function(e) {
    		var sensor = e.item;
    		var datasource = source._item;
    		datasource.hostname = sensor.hostname;
    		datasource.api_url = sensor.api_url;
    		datasource.sensor = sensor.description + ", " + sensor.location;
    	}
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

    this.isEnabled = function(item) {
    	return item.required || item.enabled;
    }.bind(this)

    this.installApp = function(manifest) {
    	return function(e) {
    		console.log(JSON.stringify(manifest));
    	}
    }.bind(this)
});