
riot.tag2('app-store', '<div class="mdl-typography--text-center"> <div class="mdl-spinner mdl-js-spinner is-active" if="{!loaded}"></div> </div> <ul class="mdl-list"> <li class="mdl-list__item mdl-list__item--two-line" each="{apps}"><a class="mdl-list__item-primary-content" href="/install/{manifest.name}"><i class="material-icons mdl-list__item-icon">extension</i><span>{manifest.name}</span><span class="mdl-list__item-sub-title">{manifest.author}</span></a></li> </ul>', '', '', function(opts) {
    this.loaded = false;
    this.apps = [];
    this.on('mount', function () {
    	$.get("/list-store", this.setApps);
    });

    this.setApps = function(data) {
    	this.apps = data;
    	this.apps.sort(function (a, b) {
    		var nameA = a.manifest.name.toUpperCase();
    		var nameB = b.manifest.name.toUpperCase();
    		return nameA.localeCompare(nameB);
    	});
    	this.loaded = true;
    	this.update();
    	componentHandler.upgradeAllRegistered();
    }.bind(this)
});