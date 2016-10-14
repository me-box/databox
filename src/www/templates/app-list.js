
riot.tag2('app-list', '<div class="mdl-typography--text-center"> <div class="mdl-spinner mdl-js-spinner is-active" if="{!loaded}"></div> </div> <div if="{listSections().length == 0}">Empty</div> <div each="{section in listSections()}"> <ul class="mdl-list"> <li class="mdl-list__item">{section}</li> <li class="mdl-list__item mdl-list__item--two-line" each="{listApps(section)}"><a class="mdl-list__item-primary-content" href="{Ports.length &gt; 0 ? \'ui\' + Names[0] + \'/\' : null}"><i class="material-icons mdl-list__item-icon">{icon}</i><span>{name}</span><span class="mdl-list__item-sub-title">{State}</span></a><span class="mdl-list__item-secondary-content"><span class="mdl-list__item-secondary-action"> <button class="mdl-button mdl-js-button mdl-button--icon" onclick="{parent.restartApp}" if="{State != \'installing\'}"><i class="material-icons">refresh</i></button> <button class="mdl-button mdl-js-button mdl-button--icon" onclick="{parent.uninstall}" if="{State != \'installing\'}" __disabled="{Section === \'System\'}"><i class="material-icons">close</i></button> <div class="mdl-spinner mdl-js-spinner is-active" if="{State == \'installing\'}"></div></span></span></li> </ul> </div>', '', '', function(opts) {
    this.loaded = false;
    this.listAll = true;
    this.sections = {
    	"app": {name: "Apps", icon: "extension"},
    	"other": {name: "System", icon: "settings_applications"},
    	"store": {name: "Datastore", icon: "dns"},
    	"driver": {name: "Drivers", icon: "developer_board"}
    };
    this.apps = [];

    this.reload = function(message)
    {
    	if (message != null) {
    		console.log(message.status + " " + message.from);
    	}
    	$.get("/list-containers", this.reloaded);
    }.bind(this)

    this.setAppSection = function(app, sectionName)
    {
    	var section = this.sections[sectionName];
    	app.Section = section.name;
    	app.icon = section.icon;
    }.bind(this)

    this.reloaded = function(data)
    {
    	this.apps = data;
    	for (var app of this.apps) {
    		app.name = app.Names[0];
    		if (app.name.startsWith('/')) {
    			app.name = app.name.substring(1);
    		}
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
    		var nameA = a.name.toUpperCase();
    		var nameB = b.name.toUpperCase();
    		return nameA.localeCompare(nameB);
    	});
    	this.loaded = true;
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)

    this.restartApp = function(e)
    {
    	var app = e.item;
    	$.post("/restart", {"id": app.Id}, function (data) {
    		console.log(data);
    	});
    }.bind(this)

    this.listSections = function()
    {
    	var sectionList = [];
    	for (var name in this.sections) {
    		var section = this.sections[name].name;
    		if (this.listAll || section === "Apps") {
    			for (var app of this.listApps()) {
    				if (app.Section === section) {
    					sectionList.push(section);
    					break;
    				}
    			}
    		}
    	}
    	return sectionList;
    }.bind(this)

    this.listApps = function(section)
    {
    	var filterString = this.filterString;
    	return this.apps.filter(function (item) {
    		return (section == null || item.Section === section) && (filterString == null || filterString.length === 0 || item.name.indexOf(filterString) !== -1);
    	});
    }.bind(this)

    this.uninstall = function(e)
    {
    	var app = e.item;
    	$.post("/uninstall", {"id": app.Id}, function (data) {
    		console.log(data);
    	});
    }.bind(this)

    var socket = io.connect(window.location.protocol + '//' + window.location.host);
    socket.on('docker-connect', this.reload);
    socket.on('docker-disconnect', function () {
    	loaded = false;
    	console.log('disconnect');
    });
    socket.on('docker-create', this.reload);
    socket.on('docker-start', this.reload);
    socket.on('docker-stop', this.reload);
    socket.on('docker-die', this.reload);
    socket.on('docker-destroy', this.reload);
});