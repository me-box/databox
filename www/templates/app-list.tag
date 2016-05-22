app-list.list-group
	.list-group-item(each="{ opts.items }")
		button.btn.btn-default.pull-right(type="button", disabled="{ hasUI ? false : true }", data-toggle="{ hasUI ? 'modal' : '' }", data-target="{hasUI ? '#app-ui' : '' }", onclick="$('#app-ui-title').text('{ image }');$('#app-ui-iframe').attr('src', '/{ name }/');") UI
		h4.list-group-item-heading { name }
		p.list-group-item-text(style="margin-bottom: 1em;")
			| Image: { image }
			br
			| Status: { status ? status : '...' }
		.panel.panel-default
			.panel-heading
				button.btn.btn-default.info-trigger(type="button", data-toggle="collapse", onclick="$(this).parent().next().collapse('toggle');") Full Info
			.panel-collapse.collapse.out
				.panel-body
					pre { info }
	script(type='text/livescript').
		self = @
		opts.items.for-each (item) !->
		  item.status <-! $.get '/' + item.name + '/status/' {}
		  self.update!
