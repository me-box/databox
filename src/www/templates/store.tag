store
	.list-group-item(each="{ opts.items }")
		button.btn.btn-default.pull-right(type="button", data-loading-text="Pulling...", onclick="{ pull }") Pull
		h4.list-group-item-heading { name }
		// TODO: Maybe show type
		p.list-group-item-text(style="margin-bottom: 1em;")
			| Poster: { poster }
		.panel.panel-default
			.panel-heading
				button.btn.btn-default.info-trigger(type="button", data-toggle="collapse", onclick="$(this).parent().next().collapse('toggle');") Full Info
			.panel-collapse.collapse.out
				.panel-body
					pre { info }
	script(type='text/livescript').
		@pull = (e) !~>
		  btn = $ e.target .button \loading
		  response <-! $.post '/pull-app' name: e.item.name
		  alert response
		  btn.button \reset
