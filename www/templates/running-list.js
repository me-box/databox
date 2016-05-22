
riot.tag2('running-list', '<div class="list-group-item" each="{opts.items}"> <button class="btn btn-default pull-right" type="button" __disabled="{hasUI ? false : true}" data-toggle="{hasUI ? \'modal\' : \'\'}" data-target="{hasUI ? \'#app-ui\' : \'\'}" onclick="$(\'#app-ui-title\').text(\'{image}\');$(\'#app-ui-iframe\').attr(\'src\', \'/{name}/\');">UI</button> <h4 class="list-group-item-heading">{name}</h4> <p class="list-group-item-text" style="margin-bottom: 1em">Image: {image}<br>Status: {status ? status : \'...\'}</p> <div class="panel panel-default"> <div class="panel-heading"> <button class="btn btn-default info-trigger" type="button" data-toggle="collapse" onclick="$(this).parent().next().collapse(\'toggle\');">Full Info</button> </div> <div class="panel-collapse collapse out"> <div class="panel-body"> <pre>{info}</pre> </div> </div> </div> </div>', '', 'class="list-group"', function(opts) {
var self;
self = this;
opts.items.forEach(function(item){
  $.get('/' + item.name + '/status/', {}, function(status){
    item.status = status;
    self.update();
  });
});
});