app-list.list-group
	.list-group-item(each="{ opts.items }")
		button.btn.btn-default(type="button", disabled="{ hasUI ? false : true }", data-toggle="{ hasUI ? 'modal' : '' }", data-target="{hasUI ? '#app-ui' : '' }", onclick="$('#app-ui-title').text('{ image }');$('#app-ui-iframe').attr('src', '{ name }/');") UI
		.panel.panel-default
			.panel-heading
				button.btn.btn-default.info-trigger(type="button", data-toggle="collapse", onclick="$(this).parent().next().collapse('toggle');") Full Info
			.panel-collapse.collapse.out(id="#{ opts.list }-item-{ index + 1 }")
				.panel-body
					pre { info }
	//script(type='text/livescript').
