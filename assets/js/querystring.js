querystring = {
	encode: function(obj, sep, eq, name) {
		sep = sep || '&';
		eq = eq || '=';
		if (obj === null) {
			obj = undefined;
		}
		
		if (typeof obj === 'object') {
			return Object.keys(obj).map(function(k) {
			var ks = encodeURIComponent(this.stringifyPrimitive(k)) + eq;
			if (Array.isArray(obj[k])) {
				return obj[k].map(function(v) {
				return ks + encodeURIComponent(this.stringifyPrimitive(v));
				}).join(sep);
			} else {
				return ks + encodeURIComponent(this.stringifyPrimitive(obj[k]));
			}
			}).filter(Boolean).join(sep);
		
		}
		
		if (!name) return '';
		return encodeURIComponent(this.stringifyPrimitive(name)) + eq +
				encodeURIComponent(this.stringifyPrimitive(obj));
	},
	decode: function(qs, sep, eq, options) {
		sep = sep || '&';
		eq = eq || '=';
		var obj = {};
		if (typeof qs !== 'string' || qs.length === 0) {
			return obj;
		}
		var regexp = /\+/g;
		qs = qs.split(sep);
		var maxKeys = 1000;
		if (options && typeof options.maxKeys === 'number') {
			maxKeys = options.maxKeys;
		}
		var len = qs.length;
		// maxKeys <= 0 means that we should not limit keys count
		if (maxKeys > 0 && len > maxKeys) {
			len = maxKeys;
		}
		for (var i = 0; i < len; ++i) {
			var x = qs[i].replace(regexp, '%20'),
				idx = x.indexOf(eq),
				kstr, vstr, k, v;
			if (idx >= 0) {
				kstr = x.substr(0, idx);
				vstr = x.substr(idx + 1);
			} else {
				kstr = x;
				vstr = '';
			}
			k = decodeURIComponent(kstr);
			v = decodeURIComponent(vstr);
			if (!this.hasOwnProperty(obj, k)) {
				obj[k] = v;
			} else if (Array.isArray(obj[k])) {
				obj[k].push(v);
			} else {
				obj[k] = [obj[k], v];
			}
		}
		return obj;
	}
};

querystring.hasOwnProperty = function(obj, prop) {return Object.prototype.hasOwnProperty.call(obj, prop);}

querystring.stringifyPrimitive = function(v) {
	switch (typeof v) {
		case 'string':
		return v;
	
		case 'boolean':
		return v ? 'true' : 'false';
	
		case 'number':
		return isFinite(v) ? v : '';
	
		default:
		return '';
	}
};


//from https://www.sitepoint.com/get-url-parameters-with-javascript/
function getAllUrlParams(url) {
	var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
	var obj = {};
	// if query string exists
	if (queryString) {
		// stuff after # is not part of query string, so get rid of it
		queryString = queryString.split('#')[0];
		var arr = queryString.split('&');
		for (var i = 0; i < arr.length; i++) {
			var a = arr[i].split('=');
			var paramNum = undefined;
			var paramName = a[0].replace(/\[\d*\]/, function(v) {
				paramNum = v.slice(1, -1);
				return '';
			});
			// set parameter value (use 'true' if empty)
			var paramValue = typeof(a[1]) === 'undefined' ? true : a[1];
			// (optional) keep case consistent
			//paramName = paramName.toLowerCase();
			//paramValue = paramValue.toLowerCase();
			// if parameter name already exists
			if (obj[paramName]) {
				// convert value to array (if still string)
				if (typeof obj[paramName] === 'string') {
					obj[paramName] = [obj[paramName]];
				}
				// if no array index number specified...
				if (typeof paramNum === 'undefined') {
					// put the value on the end of the array
					obj[paramName].push(paramValue);
				}
				// if array index number specified...
				else {
					// put the value at that index number
					obj[paramName][paramNum] = paramValue;
				}
			}
			// if param name doesn't exist yet, set it
			else {
				obj[paramName] = paramValue;
			}
		}
	}
	return obj;
}
