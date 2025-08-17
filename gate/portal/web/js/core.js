var querystring = null;

function onInitCore() {
}

function getQueryString(key) {
	if (querystring==null) updateQueryString();
	return querystring[key];
}

function updateQueryString() {
	var vars = [], hash;
	var q = document.URL.split('?')[1];
	if(q != undefined){
		q = q.split('&');
		for(var i = 0; i < q.length; i++){
			hash = q[i].split('=');
			vars.push(hash[1]);
			vars[hash[0]] = hash[1];
		}
	}
	querystring = vars;
}

function hasQueryString(key) {
	return getQueryString(key)!=null;
}

function genCode(size) {
	var code = '';
	for(var i=0; i<size; i++) {
		if (Math.random()<0.8) {
			code = code + String.fromCharCode(48 + Math.random()*10);
		} else {
			code = code + String.fromCharCode(65 + Math.random()*24);
		}
	}
	return code;
}
function padz(s, l) {
	s = '0000000' + s;
	return s.substring(s.length-l);
}
function ts2str(d) {
	return d.getDate() + "/" + (d.getMonth()+1) + '/' + (d.getFullYear()) + ' '
	+ padz(d.getHours(),2) + ':' + padz(d.getMinutes(),2) + ':' + padz(d.getSeconds(), 2);
}
function clearTable(selector) {
	$(selector).find("tr:gt(0)").remove();
}
function clearTableFull(selector) {
	$(selector).find("tr").remove();
}
function tag(name, data, className, id, attrs) {
	className = className!=null?' class="' + className + '"':'';
	id = id!=null?' id="' + id + '"':'';
	var attrValues = '';
	if (attrs!=null) {
		for(var i=0; i<attrs.length; i++) {
			var attr = attrs[i];
			attrValues += ' ' + attr.name + '="' + attr.value + '"';
		}
	}
	return '<' + name + className + id + attrValues + '>' + data + '</' + name + '>';
}
function td(data, className) {
	return tag('td', data, className);
}
function tr(data, className, id) {
	return tag('tr', data, className, id);
}
function th(data, className) {
	return tag('th', data, className);
}

function div(data, className, id) {
	return tag('div', data, className, id);
}

function a(text, className, id, location) {
	className = className!=null?' class="' + className + '"':'';
	id = id!=null?' id="' + id + '"':'';
	location = location!=null?' href="' + location + '"':'';
	return '<a' + className + id + location + '>' + text + '</a>';
}

function img(src, className, id, title) {
	className = className!=null?' class="' + className + '"':'';
	id = id!=null?' id="' + id + '"':'';
	title = title!=null?' title="' + title + '"':'';
	return '<img src="' + src + '"' + className + id + title + ' />'; 
}

function rnd(max) {
	return Math.floor(Math.random()*max);
}
function ajaxPost(url, data, onSuccess, onFailure) {
	ajaxRequest(url, 'POST', data, onSuccess, onFailure);
}
function ajaxGet(url, data, onSuccess, onFailure) {
	ajaxRequest(url, 'GET', data, onSuccess, onFailure);
}
function ajaxRequest(url, type, data, onSuccess, onFailure) {
	if (data == null) data = {};
	var request = $.ajax({
		url: url,
		type: type,
		data: data
	});
	ajaxSend(request, onSuccess, onFailure);
}

function ajaxPostBody(url, data, onSuccess, onFailure) {
	var request = $.ajax({
		url: url,
		type: 'POST',
		processData : false,
		contentType : 'application/json',
		data: JSON.stringify(data),
	});
	ajaxSend(request, onSuccess, onFailure);
}

function ajaxSend(request, onSuccess, onFailure) {
	request.done(function(response) {
		if (response==null || response == "") return;
		var json = eval("(" + response + ")");
		if (json.error != null) {
			if (onFailure!=null) onFailure(json.error);
			else alert(json.error); 
		} else {
			onSuccess(json);
		}
	});
	request.fail(function(jqXHR, textStatus) {
		//alert( "Request failed: " + textStatus );
		if (typeof onFailure == 'function') {
		    var json = eval("(" + jqXHR.responseText + ")");
		    onFailure(json.error);
		}
		else alert( "Request failed: " + textStatus );
	});
}

function extractId(s) {
	return parseInt(extractCodeId(s));
}

function extractCodeId(s) {
	return s.substring(s.indexOf('-')+1);
}

function redirect(url) {
	window.location.href = url;
}

function onBack() {
	history.back(1);
}

function isEmptyString(s) {
	return s == null || s.trim().length == 0;
}

function isNumeric(s) {
	if (isEmptyString(s)) return false;
	s = s.trim();
	return (parseInt(s, 10) != NaN);
}

function setCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function getCurrentTime() {
	var s = '';
	var d = new Date();
	s = d.getFullYear() + "-" + padz((d.getMonth()+1),2) + '-' + padz(d.getDate(),2);
	s = s + ' ';
	s = s + padz(d.getHours(),2) + ":" + padz(d.getMinutes(),2);
	return s;
}

function endsWith(s, suffix) {
	return s.indexOf(suffix, s.length - suffix.length) !== -1;
}

function timeago(time, className) {
	var finalClassName = 'timeago';
	if (className!=null) finalClassName += ' ' + className;
	return '<abbr class="' + finalClassName + '" title="' + time + '" />';
}

var SIZE_KILOBYTE = 1024;
var SIZE_MEGABYTE = SIZE_KILOBYTE * 1024;
var SIZE_GIGABYTE = SIZE_MEGABYTE * 1024;

function size2human(size) {
	if (size == 0) return "--";
	if (size >= SIZE_GIGABYTE) {
		return parseFloat(size / SIZE_GIGABYTE).toFixed(2) + " GB";
	}
	if (size >= SIZE_MEGABYTE) {
		return parseFloat(size / SIZE_MEGABYTE).toFixed(2) + " MB";
	}
	if (size >= SIZE_KILOBYTE) {
		return parseFloat(size / SIZE_KILOBYTE).toFixed(2) + " KB";
	}
	return size + " B";
}

function translate(array, key) {
    for(var i=0; i<array.length-1; i+=2) {
        if (key == array[i]) return array[i+1];
    }
    return key;
}

function build_options(array, selector) {
    var select = $(selector);
    select.html('');
    for(var i=0; i<array.length-1; i+=2) {
        var value = array[i];
        var label = array[i+1];
        var option = $('<option></option>');
        option.attr('value', value);
        option.text(label);
        select.append(option);
    }
}

$(document).ready(onInitCore);

