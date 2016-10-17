
riot.tag2('app-store', '<div class="mdl-typography--text-center"> <div class="mdl-spinner mdl-js-spinner is-active" if="{!loaded}"></div> </div> <div if="{listSections().length == 0}">Empty</div> <div each="{section in listSections()}"> <ul class="mdl-list"> <li class="mdl-list__item">{section.name}</li> <li class="mdl-list__item mdl-list__item--two-line" each="{listApps(section.id)}"><a class="mdl-list__item-primary-content" href="/install/{manifest.name}"><i class="material-icons mdl-list__item-icon">{icon}</i><span>{manifest.name}</span><span class="mdl-list__item-sub-title">{manifest.author}</span></a></li> </ul> </div>', '', '', function(opts) {
    this.loaded = false;
    this.apps = [];
    this.sections = [
    	{id: "app", name: "Apps", icon: "extension"},
    	{id: "driver", name: "Drivers", icon: "developer_board"},
    	{id: "store", name: "Datastores", icon: "dns"}
    ];
    this.on('mount', function () {
    	$.get("/list-store", this.setApps);
    });

    this.setApps = function(data) {
    	this.apps = data;
    	for (var app of this.apps) {
    		for(var section of this.sections) {
    			if(app.manifest.name.endsWith(section.id) || app.manifest.name.indexOf(section.id + '-') !== -1) {
    				app.section = section.id;
    				app.icon = section.icon;
    			}
    		}
    		if(app.section == null) {
    			app.section = "app";
    			app.icon = "extension";
    		}
    	}
    	this.apps.sort(function (a, b) {
    		var nameA = a.manifest.name.toUpperCase();
    		var nameB = b.manifest.name.toUpperCase();
    		return nameA.localeCompare(nameB);
    	});
    	this.loaded = true;
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)

    this.listSections = function()
    {
    	var sectionList = [];
    	for (var section of this.sections) {
    		for (var app of this.listApps()) {
    			if (app.section === section.id) {
    				sectionList.push(section);
    				break;
    			}
    		}
    	}
    	return sectionList;
    }.bind(this)

    this.listApps = function(section) {
    	var filterString = this.filterString;
    	var result = this.apps.filter(function (item) {
    		return (section == null || item.section === section) && (filterString == null || filterString.length === 0 || item.manifest.name.indexOf(filterString) !== -1);
    	});

    	return result;
    }.bind(this)
});