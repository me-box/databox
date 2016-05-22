
riot.tag2('store', '<div class="list-group-item" each="{opts.items}"> <button class="btn btn-default pull-right" type="button" data-loading-text="Pulling..." onclick="{pull}">Pull</button> <h4 class="list-group-item-heading">{name}</h4> <p class="list-group-item-text" style="margin-bottom: 1em">Poster: {poster}</p> <div class="panel panel-default"> <div class="panel-heading"> <button class="btn btn-default info-trigger" type="button" data-toggle="collapse" onclick="$(this).parent().next().collapse(\'toggle\');">Full Info</button> </div> <div class="panel-collapse collapse out"> <div class="panel-body"> <pre>{info}</pre> </div> </div> </div> </div>', '', '', function(opts) {
var this$ = this;
this.pull = function(e){
  var btn;
  btn = $(e.target).button('loading');
  $.post('/pull-app', {
    name: e.item.name
  }, function(response){
    alert(response);
    btn.button('reset');
  });
};
});