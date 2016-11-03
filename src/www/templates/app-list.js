function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (apps, icons) {if (apps.length === 0) {
pug_html = pug_html + "\u003Cdiv\u003EEmpty\u003C\u002Fdiv\u003E";
}
else {
pug_html = pug_html + "\u003Cul class=\"mdl-list\"\u003E";
var prevInstalled = false;
// iterate apps
;(function(){
  var $$obj = apps;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var app = $$obj[pug_index0];
var installed = ('container_id' in app) || app.status === 'installing';
{
if (prevInstalled && !installed) {
pug_html = pug_html + "\u003Chr\u002F\u003E";
}
prevInstalled = installed;
pug_html = pug_html + "\u003Cli class=\"mdl-list__item mdl-list__item--two-line\"\u003E\u003Ca" + (" class=\"mdl-list__item-primary-content\""+pug_attr("href", ('container_id' in app) ? '/ui/' + app.name : '/install/' + app.name, true, false)) + "\u003E\u003Ci" + (pug_attr("class", pug_classes(["material-icons","mdl-list__item-icon",installed ? '' : 'mdl-color-text--grey-500'], [false,false,true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = app.type in icons ? icons[app.type] : icons['other']) ? "" : pug_interp)) + "\u003C\u002Fi\u003E\u003Cspan\u003E" + (pug_escape(null == (pug_interp = app.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
if (installed) {
pug_html = pug_html + "\u003Cspan class=\"mdl-list__item-sub-title\"\u003E" + (pug_escape(null == (pug_interp = app.status) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
else {
pug_html = pug_html + "\u003Cspan class=\"mdl-list__item-sub-title\"\u003E" + (pug_escape(null == (pug_interp = app.author) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fa\u003E\u003Cspan class=\"mdl-list__item-secondary-content\"\u003E\u003Cspan class=\"mdl-list__item-secondary-action\"\u003E";
if ('container_id' in app) {
pug_html = pug_html + "\u003Cbutton" + (" class=\"mdl-button mdl-js-button mdl-button--icon\""+pug_attr("onclick", 'restartApp("' + app.container_id + '")', true, false)+pug_attr("disabled", ('type' in app && app.type !== 'driver' && app.type !== 'app' && app.type !== 'store'), true, false)) + "\u003E\u003Ci class=\"material-icons\"\u003Erefresh\u003C\u002Fi\u003E\u003C\u002Fbutton\u003E\u003Cbutton" + (" class=\"mdl-button mdl-js-button mdl-button--icon\""+pug_attr("onclick", 'uninstallApp("' + app.container_id + '")', true, false)+pug_attr("disabled", ('type' in app && app.type !== 'driver' && app.type !== 'app' && app.type !== 'store'), true, false)) + "\u003E\u003Ci class=\"material-icons\"\u003Eclose\u003C\u002Fi\u003E\u003C\u002Fbutton\u003E";
}
if (app.status === 'installing') {
pug_html = pug_html + "\u003Cdiv class=\"mdl-spinner mdl-js-spinner is-active\"\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003C\u002Fli\u003E";
}
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var app = $$obj[pug_index0];
var installed = ('container_id' in app) || app.status === 'installing';
{
if (prevInstalled && !installed) {
pug_html = pug_html + "\u003Chr\u002F\u003E";
}
prevInstalled = installed;
pug_html = pug_html + "\u003Cli class=\"mdl-list__item mdl-list__item--two-line\"\u003E\u003Ca" + (" class=\"mdl-list__item-primary-content\""+pug_attr("href", ('container_id' in app) ? '/ui/' + app.name : '/install/' + app.name, true, false)) + "\u003E\u003Ci" + (pug_attr("class", pug_classes(["material-icons","mdl-list__item-icon",installed ? '' : 'mdl-color-text--grey-500'], [false,false,true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = app.type in icons ? icons[app.type] : icons['other']) ? "" : pug_interp)) + "\u003C\u002Fi\u003E\u003Cspan\u003E" + (pug_escape(null == (pug_interp = app.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
if (installed) {
pug_html = pug_html + "\u003Cspan class=\"mdl-list__item-sub-title\"\u003E" + (pug_escape(null == (pug_interp = app.status) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
else {
pug_html = pug_html + "\u003Cspan class=\"mdl-list__item-sub-title\"\u003E" + (pug_escape(null == (pug_interp = app.author) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fa\u003E\u003Cspan class=\"mdl-list__item-secondary-content\"\u003E\u003Cspan class=\"mdl-list__item-secondary-action\"\u003E";
if ('container_id' in app) {
pug_html = pug_html + "\u003Cbutton" + (" class=\"mdl-button mdl-js-button mdl-button--icon\""+pug_attr("onclick", 'restartApp("' + app.container_id + '")', true, false)+pug_attr("disabled", ('type' in app && app.type !== 'driver' && app.type !== 'app' && app.type !== 'store'), true, false)) + "\u003E\u003Ci class=\"material-icons\"\u003Erefresh\u003C\u002Fi\u003E\u003C\u002Fbutton\u003E\u003Cbutton" + (" class=\"mdl-button mdl-js-button mdl-button--icon\""+pug_attr("onclick", 'uninstallApp("' + app.container_id + '")', true, false)+pug_attr("disabled", ('type' in app && app.type !== 'driver' && app.type !== 'app' && app.type !== 'store'), true, false)) + "\u003E\u003Ci class=\"material-icons\"\u003Eclose\u003C\u002Fi\u003E\u003C\u002Fbutton\u003E";
}
if (app.status === 'installing') {
pug_html = pug_html + "\u003Cdiv class=\"mdl-spinner mdl-js-spinner is-active\"\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003C\u002Fli\u003E";
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ful\u003E";
}
pug_html = pug_html + "\u003Cscript\u003Efunction restartApp(container_id) {\n\t$.post(\"\u002Frestart\", {\"id\": container_id});\n}\n\nfunction uninstallApp(container_id) {\n\t$.post(\"\u002Funinstall\", {\"id\": container_id});\n}\u003C\u002Fscript\u003E";}.call(this,"apps" in locals_for_with?locals_for_with.apps:typeof apps!=="undefined"?apps:undefined,"icons" in locals_for_with?locals_for_with.icons:typeof icons!=="undefined"?icons:undefined));;return pug_html;}