app-store
	div.mdl-typography--text-center
		div.mdl-spinner.mdl-js-spinner.is-active(if="{!loaded}")
	ul.mdl-list
		li.mdl-list__item.mdl-list__item--two-line(each="{ apps }")
			a.mdl-list__item-primary-content(href="/install/{ manifest.name }")
				i.material-icons.mdl-list__item-icon
					| extension
				span
					| { manifest.name }
				span.mdl-list__item-sub-title
					| { manifest.author }
	script.
		this.loaded = false;
		this.apps = [];
		this.on('mount', function () {
			$.get("/list-store", this.setApps);
		});

		setApps(data) {
			this.apps = data;
			this.apps.sort(function (a, b) {
				var nameA = a.manifest.name.toUpperCase(); // ignore upper and lowercase
				var nameB = b.manifest.name.toUpperCase(); // ignore upper and lowercase
				return nameA.localeCompare(nameB);
			});
			this.loaded = true;
			this.update();
			componentHandler.upgradeAllRegistered();
		}