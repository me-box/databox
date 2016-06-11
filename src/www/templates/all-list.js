
riot.tag2('all-list', '<div class="list-group-item" each="{opts.items}"> <button class="btn btn-default pull-right" type="button" data-loading-text="Launching..." onclick="{launch}">Launch</button> <h4 class="list-group-item-heading">{repoTag}</h4> <p class="list-group-item-text" style="margin-bottom: 1em">Image: {repoTag}<br>Status: {status ? status : \'...\'}</p> <div class="panel panel-default"> <div class="panel-heading"> <button class="btn btn-default info-trigger" type="button" data-toggle="collapse" onclick="$(this).parent().next().collapse(\'toggle\');">Full Info</button> </div> <div class="panel-collapse collapse out"> <div class="panel-body"> <pre>{info}</pre> </div> </div> </div> </div>', '', 'class="list-group"', function(opts) {
var this$ = this;
this.launch = function(e){
  var btn;
  btn = $(e.target).button('loading');
  $.post('/launch-container', {
    repoTag: e.item.repoTag
  }, function(response){
    alert("App launched: " + response);
    btn.button('reset');
  });
};
});