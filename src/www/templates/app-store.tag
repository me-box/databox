app-store
	div.mdl-typography--text-center
		div.mdl-spinner.mdl-js-spinner.is-active(if="{!loaded}")
	div(if="{ listSections().length == 0 }")
		| Empty
	div(each="{ section in listSections() }")
		ul.mdl-list
			li.mdl-list__item
				| { section.name }
			li.mdl-list__item.mdl-list__item--two-line(each="{ listApps(section.id) }")
				a.mdl-list__item-primary-content(href="/install/{ manifest.name }")
					i.material-icons.mdl-list__item-icon
						| { icon }
					span
						| { manifest.name }
					span.mdl-list__item-sub-title
						| { manifest.author }
	script.
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

		setApps(data) {
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
				var nameA = a.manifest.name.toUpperCase(); // ignore upper and lowercase
				var nameB = b.manifest.name.toUpperCase(); // ignore upper and lowercase
				return nameA.localeCompare(nameB);
			});
			this.loaded = true;
			this.update();
			componentHandler.upgradeAllRegistered();
		}

		listSections()
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
		}

		listApps(section) {
			var filterString = this.filterString;
			var result = this.apps.filter(function (item) {
				return (section == null || item.section === section) && (filterString == null || filterString.length === 0 || item.manifest.name.indexOf(filterString) !== -1);
			});

			return result;
		}