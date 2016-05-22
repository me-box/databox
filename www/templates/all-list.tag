all-list.list-group
	.list-group-item(each="{ opts.items }")
		button.btn.btn-default.pull-right(type="button", data-loading-text="Launching...", onclick="{ launch }") Launch
		h4.list-group-item-heading { repoTag }
		// TODO: Maybe show type
		p.list-group-item-text(style="margin-bottom: 1em;")
			| Image: { repoTag }
			br
			| Status: { status ? status : '...' }
		.panel.panel-default
			.panel-heading
				button.btn.btn-default.info-trigger(type="button", data-toggle="collapse", onclick="$(this).parent().next().collapse('toggle');") Full Info
			.panel-collapse.collapse.out
				.panel-body
					pre { info }
	script(type='text/livescript').
		@launch = (e) !~>
		  btn = $ e.target .button \loading
		  response <-! $.post '/launch-container' repo-tag: e.item.repo-tag
		  alert "App launched: #response"
		  btn.button \reset
		
		#self = @
		#opts.items.for-each (item) !->
		#  item.status <-! $.get '/' + item.name + '/status/' {}
		#  self.update!
