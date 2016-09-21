databox-manifest.mdl-layout.mdl-js-layout.mdl-layout--fixed-header
	header.mdl-layout__header
		div.mdl-layout__header-row
			span.mdl-layout-title
				| {opts.manifest.name}
	main.mdl-layout__content
		div
			| {opts.manifest.description}
		div
			| {opts.manifest.author}
		div
			a(href="{opts.manifest.homepage}")
				| {opts.manifest.homepage}
		div.mdl-grid
			div.mdl-cell.mdl-cell--4-col(each="{ opts.manifest.packages }", onclick="{ parent.togglePackage }", class="{transparent: !isEnabled(this)}")
				div.badge.material-icons(if="{ isEnabled(this) }")
					| check
				div.package_title
					| {name}
				div.purpose
					| {purpose}
				div.benefits
					| {benefits}
				div.exchange
					| in exchange for
				div.risk
					| {risk}
				div.required
					| {selectedText(this)}
		div(each="{ opts.manifest.datasources }")
			div(id="{'datasource_' + clientid}")
				| { name } = { sensor || "Unbound" }
			div.mdl-menu.mdl-js-menu.mdl-js-ripple-effect(for="{'datasource_' + clientid }")
				div.mdl-menu__item(each="{ parent.opts.sensors }", onclick="{ parent.selectSensor(parent)}")
					| { description }, { location }
		button.mdl-button(onclick="{ installApp(opts.manifest) }")
			| Install
	script.
		togglePackage(e) {
			var package = e.item;
			if (!package.required) {
				package.enabled = !package.enabled;
			}
			return true;
		}

		selectSensor(source) {
			return function(e) {
				var sensor = e.item;
				var datasource = source._item;
				datasource.hostname = sensor.hostname;
				datasource.api_url = sensor.api_url;
				datasource.sensor = sensor.description + ", " + sensor.location;
			}
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

		isEnabled(item) {
			return item.required || item.enabled;
		}

		installApp(manifest) {
			return function(e) {
				console.log(JSON.stringify(manifest));
			}
		}
