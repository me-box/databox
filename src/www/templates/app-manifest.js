function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (manifest, sensors) {function getSensors(type) {
	if (type == null) {
		return sensors;
	}
	else {
		return sensors.filter(function (sensor) {
			return sensor.type === type;
		});
	}
}

function getDatasource(id) {
	for(var datasource of manifest.datasources) {
		if(datasource.clientid === id) {
			return datasource;
		}
	}
}

function isValid() {
	//if('datasources' in manifest) {
	//	for (var datasource of manifest.datasources) {
	//		if (datasource.endpoint == null) {
	//			return false;
	//		}
	//	}
	//}
	return true;
}

pug_html = pug_html + "\u003Cdiv\u003E\u003Cdiv class=\"padded\"\u003E" + (pug_escape(null == (pug_interp = manifest.description) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"padded\"\u003E\u003Cdiv\u003E" + (pug_escape(null == (pug_interp = manifest.author) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv\u003E\u003Ca" + (pug_attr("href", manifest.homepage, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = manifest.homepage) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
if ('packages' in manifest) {
pug_html = pug_html + "\u003Cdiv class=\"mdl-grid\"\u003E";
// iterate manifest.packages
;(function(){
  var $$obj = manifest.packages;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var pack = $$obj[pug_index0];
pug_html = pug_html + "\u003Cdiv" + (pug_attr("class", pug_classes(["mdl-cell","mdl-cell--4-col","package",(pack.required || pack.enabled) ? '' : 'transparent'], [false,false,false,true]), false, false)+pug_attr("onclick", 'togglePackage("' + pack.id + '")', true, false)) + "\u003E\u003Cdiv class=\"dark\" style=\"display: flex; align-items: center\"\u003E\u003Cdiv class=\"mdl-typography--title fill padded\"\u003E" + (pug_escape(null == (pug_interp = pack.name) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
if (pack.enabled || pack.required) {
pug_html = pug_html + "\u003Cdiv class=\"badge material-icons\"\u003Echeck\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + ("\u003C\u002Fdiv\u003E\u003Cdiv class=\"mdl-color--cyan-800 fill padded\"\u003E" + (pug_escape(null == (pug_interp = pack.purpose) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"mdl-color--cyan-800 padded\"\u003E" + (pug_escape(null == (pug_interp = pack.benefits) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"exchange\"\u003Ein exchange for\u003C\u002Fdiv\u003E\u003Cdiv class=\"dark padded\"\u003E" + (pug_escape(null == (pug_interp = pack.risks) ? "" : pug_interp)));
if ('datasources' in pack) {
// iterate pack.datasources
;(function(){
  var $$obj = pack.datasources;
  if ('number' == typeof $$obj.length) {
      for (var pug_index1 = 0, $$l = $$obj.length; pug_index1 < $$l; pug_index1++) {
        var datasource = $$obj[pug_index1];
pug_html = pug_html + "\u003Cdiv\u003E" + (pug_escape(null == (pug_interp = 'Access to ' + getDatasource(datasource).type) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index1 in $$obj) {
      $$l++;
      var datasource = $$obj[pug_index1];
pug_html = pug_html + "\u003Cdiv\u003E" + (pug_escape(null == (pug_interp = 'Access to ' + getDatasource(datasource).type) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
if (pack.required) {
pug_html = pug_html + "\u003Cdiv class=\"mdl-color--red-700 mdl-typography--text-center padded\"\u003ERequired\u003C\u002Fdiv\u003E";
}
else
if (pack.enabled) {
pug_html = pug_html + "\u003Cdiv class=\"mdl-color--red-700 mdl-typography--text-center padded\"\u003E" + (pug_escape(null == (pug_interp = 'Disable ' + pack.name) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
}
else {
pug_html = pug_html + "\u003Cdiv class=\"mdl-color--red-700 mdl-typography--text-center padded\"\u003E" + (pug_escape(null == (pug_interp = 'Enable ' + pack.name) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var pack = $$obj[pug_index0];
pug_html = pug_html + "\u003Cdiv" + (pug_attr("class", pug_classes(["mdl-cell","mdl-cell--4-col","package",(pack.required || pack.enabled) ? '' : 'transparent'], [false,false,false,true]), false, false)+pug_attr("onclick", 'togglePackage("' + pack.id + '")', true, false)) + "\u003E\u003Cdiv class=\"dark\" style=\"display: flex; align-items: center\"\u003E\u003Cdiv class=\"mdl-typography--title fill padded\"\u003E" + (pug_escape(null == (pug_interp = pack.name) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
if (pack.enabled || pack.required) {
pug_html = pug_html + "\u003Cdiv class=\"badge material-icons\"\u003Echeck\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + ("\u003C\u002Fdiv\u003E\u003Cdiv class=\"mdl-color--cyan-800 fill padded\"\u003E" + (pug_escape(null == (pug_interp = pack.purpose) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"mdl-color--cyan-800 padded\"\u003E" + (pug_escape(null == (pug_interp = pack.benefits) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"exchange\"\u003Ein exchange for\u003C\u002Fdiv\u003E\u003Cdiv class=\"dark padded\"\u003E" + (pug_escape(null == (pug_interp = pack.risks) ? "" : pug_interp)));
if ('datasources' in pack) {
// iterate pack.datasources
;(function(){
  var $$obj = pack.datasources;
  if ('number' == typeof $$obj.length) {
      for (var pug_index2 = 0, $$l = $$obj.length; pug_index2 < $$l; pug_index2++) {
        var datasource = $$obj[pug_index2];
pug_html = pug_html + "\u003Cdiv\u003E" + (pug_escape(null == (pug_interp = 'Access to ' + getDatasource(datasource).type) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index2 in $$obj) {
      $$l++;
      var datasource = $$obj[pug_index2];
pug_html = pug_html + "\u003Cdiv\u003E" + (pug_escape(null == (pug_interp = 'Access to ' + getDatasource(datasource).type) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
if (pack.required) {
pug_html = pug_html + "\u003Cdiv class=\"mdl-color--red-700 mdl-typography--text-center padded\"\u003ERequired\u003C\u002Fdiv\u003E";
}
else
if (pack.enabled) {
pug_html = pug_html + "\u003Cdiv class=\"mdl-color--red-700 mdl-typography--text-center padded\"\u003E" + (pug_escape(null == (pug_interp = 'Disable ' + pack.name) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
}
else {
pug_html = pug_html + "\u003Cdiv class=\"mdl-color--red-700 mdl-typography--text-center padded\"\u003E" + (pug_escape(null == (pug_interp = 'Enable ' + pack.name) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
if ('datasources' in manifest && manifest.datasources.length > 0) {
pug_html = pug_html + "\u003Cdiv class=\"padded\"\u003E\u003Cdiv class=\"padded mdl-color--cyan-800 mdl-typography--subhead mdl-color-text--white\"\u003EDatasources\u003C\u002Fdiv\u003E\u003Cul class=\"mdl-list\"\u003E";
// iterate manifest.datasources
;(function(){
  var $$obj = manifest.datasources;
  if ('number' == typeof $$obj.length) {
      for (var pug_index3 = 0, $$l = $$obj.length; pug_index3 < $$l; pug_index3++) {
        var datasource = $$obj[pug_index3];
pug_html = pug_html + "\u003Cli" + (" class=\"mdl-list__item mdl-list__item--two-line\""+pug_attr("id", 'datasource_' + datasource.clientid, true, false)) + "\u003E\u003Cspan class=\"mdl-list__item-primary-content\"\u003E\u003Ci class=\"material-icons mdl-list__item-icon\"\u003Einput\u003C\u002Fi\u003E\u003Cspan\u003E" + (pug_escape(null == (pug_interp = datasource.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003Cspan class=\"mdl-list__item-sub-title\"\u003E" + (pug_escape(null == (pug_interp = datasource.sensor || "Unbound") ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003Cul" + (" class=\"mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect\""+pug_attr("for", 'datasource_' + datasource.clientid, true, false)) + "\u003E";
if (sensors === null) {
pug_html = pug_html + "\u003Cli class=\"mdl-menu__item\" disabled=\"disabled\"\u003ENo sensors found\u003C\u002Fli\u003E";
}
else
if (getSensors(datasource.type).length === 0) {
pug_html = pug_html + "\u003Cli class=\"mdl-menu__item\" disabled=\"disabled\"\u003ENo sensors found\u003C\u002Fli\u003E";
}
else {
// iterate getSensors(datasource.type)
;(function(){
  var $$obj = getSensors(datasource.type);
  if ('number' == typeof $$obj.length) {
      for (var pug_index4 = 0, $$l = $$obj.length; pug_index4 < $$l; pug_index4++) {
        var sensor = $$obj[pug_index4];
pug_html = pug_html + "\u003Cli" + (" class=\"mdl-menu__item\""+pug_attr("onclick", 'selectSensor("' + datasource.clientid + '",' + sensor.index + ')', true, false)) + "\u003E" + (pug_escape(null == (pug_interp = sensor.type + ', ' + sensor.location) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index4 in $$obj) {
      $$l++;
      var sensor = $$obj[pug_index4];
pug_html = pug_html + "\u003Cli" + (" class=\"mdl-menu__item\""+pug_attr("onclick", 'selectSensor("' + datasource.clientid + '",' + sensor.index + ')', true, false)) + "\u003E" + (pug_escape(null == (pug_interp = sensor.type + ', ' + sensor.location) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fli\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index3 in $$obj) {
      $$l++;
      var datasource = $$obj[pug_index3];
pug_html = pug_html + "\u003Cli" + (" class=\"mdl-list__item mdl-list__item--two-line\""+pug_attr("id", 'datasource_' + datasource.clientid, true, false)) + "\u003E\u003Cspan class=\"mdl-list__item-primary-content\"\u003E\u003Ci class=\"material-icons mdl-list__item-icon\"\u003Einput\u003C\u002Fi\u003E\u003Cspan\u003E" + (pug_escape(null == (pug_interp = datasource.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003Cspan class=\"mdl-list__item-sub-title\"\u003E" + (pug_escape(null == (pug_interp = datasource.sensor || "Unbound") ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003Cul" + (" class=\"mdl-menu mdl-menu--bottom-left mdl-js-menu mdl-js-ripple-effect\""+pug_attr("for", 'datasource_' + datasource.clientid, true, false)) + "\u003E";
if (sensors === null) {
pug_html = pug_html + "\u003Cli class=\"mdl-menu__item\" disabled=\"disabled\"\u003ENo sensors found\u003C\u002Fli\u003E";
}
else
if (getSensors(datasource.type).length === 0) {
pug_html = pug_html + "\u003Cli class=\"mdl-menu__item\" disabled=\"disabled\"\u003ENo sensors found\u003C\u002Fli\u003E";
}
else {
// iterate getSensors(datasource.type)
;(function(){
  var $$obj = getSensors(datasource.type);
  if ('number' == typeof $$obj.length) {
      for (var pug_index5 = 0, $$l = $$obj.length; pug_index5 < $$l; pug_index5++) {
        var sensor = $$obj[pug_index5];
pug_html = pug_html + "\u003Cli" + (" class=\"mdl-menu__item\""+pug_attr("onclick", 'selectSensor("' + datasource.clientid + '",' + sensor.index + ')', true, false)) + "\u003E" + (pug_escape(null == (pug_interp = sensor.type + ', ' + sensor.location) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index5 in $$obj) {
      $$l++;
      var sensor = $$obj[pug_index5];
pug_html = pug_html + "\u003Cli" + (" class=\"mdl-menu__item\""+pug_attr("onclick", 'selectSensor("' + datasource.clientid + '",' + sensor.index + ')', true, false)) + "\u003E" + (pug_escape(null == (pug_interp = sensor.type + ', ' + sensor.location) ? "" : pug_interp)) + "\u003C\u002Fli\u003E";
    }
  }
}).call(this);

}
pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fli\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ful\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003Cbutton" + (" class=\"mdl-button mdl-button--colored mdl-button--raised\""+" style=\"float: right\" onclick=\"installApp()\""+pug_attr("disabled", !isValid(), true, false)) + "\u003EInstall\u003C\u002Fbutton\u003E\u003C\u002Fdiv\u003E";}.call(this,"manifest" in locals_for_with?locals_for_with.manifest:typeof manifest!=="undefined"?manifest:undefined,"sensors" in locals_for_with?locals_for_with.sensors:typeof sensors!=="undefined"?sensors:undefined));;return pug_html;}