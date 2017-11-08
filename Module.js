;(function(){

	var console_methods = ["log", "group", "debug", "trace", 
		"error", "warn", "info", "time", "timeEnd", "dir"];

	var g = function(str, fn){
		this.group(str);
		fn();
		this.end();
	};

	var gc = function(str, fn){
		this.groupc(str);
		fn();
		this.end();
	};

	var make_enabled_logger = function(){
		var enabled_logger = console.log.bind(console);
		enabled_logger.enabled = true;
		enabled_logger.disabled = false;

		console_methods.forEach(function(name){
			enabled_logger[name] = console[name].bind(console);
		});

		enabled_logger.groupc = console.groupCollapsed.bind(console);
		enabled_logger.end = console.groupEnd.bind(console);
		enabled_logger.close = function(closure, ctx){
			if (typeof closure === "function"){
				closure.call(ctx);
			}
			this.end();
		};

		enabled_logger.g = g;
		enabled_logger.gc = gc;

		enabled_logger.isLogger = true;
		
		return enabled_logger;
	};


	var noop = function(){};

	var make_disabled_logger = function(){
		var disabled_logger = function(){};
		disabled_logger.disabled = true;
		disabled_logger.enabled = false;
		console_methods.forEach(function(name){
			disabled_logger[name] = noop;
		});
		disabled_logger.groupc = noop;
		disabled_logger.end = noop;
		disabled_logger.close = function(closure, ctx){
			if (typeof closure === "function"){
				closure.call(ctx);
			}
		};
		disabled_logger.g = g;
		disabled_logger.gc = gc;

		disabled_logger.isLogger = true;
		
		return disabled_logger;
	};

	var enabled_logger = make_enabled_logger();
	var disabled_logger = make_disabled_logger();

	enabled_logger.on = disabled_logger.on = enabled_logger;
	enabled_logger.off = disabled_logger.off = disabled_logger;

	var logger = window.logger = function(value){
		if (typeof value === "function" && value.isLogger){
			return value;
		} else if (value){
			return enabled_logger;
		} else {
			return disabled_logger;
		}
	};

	window.log = logger(true);
	window.debug = logger(false);

var P = window.P = function(){
	var $resolve, $reject;
	var p = new Promise(function(resolve, reject){
		$resolve = resolve;
		$reject = reject;
	});

	p.resolve = $resolve;
	p.reject = $reject;

	return p;
};

var set = function(){
	var arg;
	for (var i = 0; i < arguments.length; i++){
		arg = arguments[i];

		// pojo arg
		if (arg && arg.constructor === Object){

			// iterate over arg props
			for (var j in arg){

				// set_*
				if (this["set_" + j]){
					this["set_" + j](arg[j]);
					// create a .set_assign() method that simply calls assign with the arg...

				// "assign" prop will just call assign
				} else if (j === "assign") {
					this.assign(arg[j]);

				} else if (this[j] && this[j].set){
					this[j].set(arg[j]);

				// existing prop is a pojo - "extend" it
				} else if (this[j] && this[j].constructor === Object){

					// make sure its safe
					if (this.hasOwnProperty(j))
						set.call(this[j], arg[j]);

					// if not, protect the prototype
					else {
						this[j] = set.call(Object.create(this[j]), arg[j]);
					}

				// everything else, assign
				} else {
					// basically just arrays and fns...
					// console.warn("what are you", arg[j]);
					this[j] = arg[j];
				}
			}

		// non-pojo arg
		} else if (this.set_value){
			// auto apply if arg is array?
			this.set_value(arg);

		// oops
		} else {
			console.warn("not sure what to do with", arg);
		}
	}

	return this; // important
};


var createConstructor = function(o){
	var name = (o && o.name) || this.name + "Ext";
	o && delete o.name;
	eval("var " + name + ";");
	var constructor = eval("(" + name + " = function(){\r\n\
		if (!(this instanceof " + name + "))\r\n\
			return new (" + name + ".bind.apply(" + name + ", [null].concat([].slice.call(arguments)) ));\r\n\
		return this.instantiate.apply(this, arguments);\r\n\
	});");
	return constructor;
};

var Base = window.Base = function(){
	if (!(this instanceof Base))
		return new (Base.bind.apply(Base, [null].concat([].slice.call(arguments))));
	return this.instantiate.apply(this, arguments);
};

Base.assign = Base.prototype.assign = function(){
	var arg;
	for (var i = 0; i < arguments.length; i++){
		arg = arguments[i];
		for (var prop in arg){
			this[prop] = arg[prop];
		}
	}
	return this;
};

Base.prototype.instantiate = function(){};
Base.prototype.set = set;
Base.prototype.log = logger(false);
Base.prototype.set_log = function(value){
	this.log = logger(value);
};

Base.createConstructor = createConstructor;
Base.extend = function(o){
	var Ext = this.createConstructor(o);
	Ext.assign = this.assign;
	Ext.assign(this);
	Ext.prototype = Object.create(this.prototype);
	Ext.prototype.constructor = Ext;
	Ext.prototype.set.apply(Ext.prototype, arguments);

	return Ext;
};

var debug = true;

var Module = window.Module = Base.extend({
	name: "Module",
	base: "modules",
	debug: logger(debug),
	log: logger(false || debug),
	set_debug: function(value){
		this.debug = logger(value);
		this.log = logger(value);
	},
	instantiate: function(token){
		var id = typeof token === "string" ?
			this.resolve(token) : false;

		var cached = id && Module.get(id);

		if (cached){
			cached.set.apply(cached, arguments);
			cached.reinitialize();
			return cached;

		} else {
			this.set.apply(this, arguments);
			this.initialize();
			return this;
		}
	},
	resolve: function(token){
		// mimic ending?
		var parts = token.split("/");

		// "path/thing/" --> "path/thing/thing.js"
		if (token[token.length-1] === "/"){
			token = token + parts[parts.length-2] + ".js";
		// last part doesn't contain a "."
		// "path/thing" --> "path/thing/thing.js"
		} else if (parts[parts.length-1].indexOf(".") < 0){
			token = token + "/" + parts[parts.length-1] + ".js";
		}

		if (token[0] !== "/")
			token = "/" + Module.base + "/" + token;

		return token; 
	},
	initialize: function(){
		var a;

		this.ready = P();
		this.exports = {}; // module.exports is from node-land, an empty object

		if (!this.id){
			a = document.createElement("a");
			a.href = document.currentScript.src;
			this.id = a.pathname;
			this.set_log(true);
		}

		// cache me
		Module.set(this.id, this);

		// handle incoming arguments
		this.reinitialize();
	},
	reinitialize: function(){
		// have we defined?
		if (!this.defined){
			// no, either define() or queue the request

			// factory function available
			if (this.factory){
				this.define();

			// no factory function to define with
			} else if (!this.queued && !this.requested) {
				// queue up the request
				this.queued = setTimeout(this.request.bind(this), 0);
				this.debug("Queued Module('"+this.id+"')");
			}

		// we already defined
		} else {
			// if the previous .factory was overridden, this is trouble
			if (this.factory !== this.defined)
				throw "do not redefine a module with a new .factory fn";
		}

	},
	define: function(){
		// clear the request, if queued
		if (this.queued)
			clearTimeout(this.queued);

		this.defined = this.factory;

		if (this.deps){
			this.debug("Defined Module('"+this.id+"', [" + this.deps.join(", ")+ "])");
			this.ready.resolve(
				Promise.all( this.deps.map((dep) => this.import(dep)) )
					   .then((args) => {
					   		this.log(this.id, "almost ready");
					   		return args;
					   })
					   .then((args) => {
					   		this.log(this.id, "ready");
					   		return this.exec.apply(this, args)
					   	})
			);
		} else {
			this.debug("Defined Module('"+this.id+"')");
			this.ready.resolve(this.exec());
		}
	},
	import: function(token){
		var module = new this.constructor(token);
		this.debug(this.id, "importing", module.id);
			// checks cache, returns existing or new
			// if new, queues request
			// when <script> arrives, and Module() is defined, it gets the cached module
			// and defines all deps, waits for all deps, then executes its factory, then resolves this .ready promise
		return module.ready;
	},
	exec: function(){
		var params = Module.params(this.factory);
		var ret;

		this.log.group(this.id);
		
		if (params[0] === "require"){
			ret = this.factory.call(this, this.require.bind(this), this.exports, this);
			if (typeof ret === "undefined")
				this.value = this.exports;
			else 
				this.value = ret;
		} else {
			this.value = this.factory.apply(this, arguments);
		}

		this.log.end();

		return this.value;
	},
	set_token: function(token){
		this.token = token;
		this.id = this.resolve(this.token);
	},
	set_value: function(arg){
		if (typeof arg === "string")
			this.set_token(arg);
		else if (toString.call(arg) === '[object Array]')
			this.deps = arg;
		else if (typeof arg === "function")
			this.factory = arg;
		else if (typeof arg === "object")
			this.assign(arg);
		else if (typeof arg === "undefined"){
			// I think I had an acceptable use case for this, can't remember when it happens
			console.warn("set(undefined)?");
		}
		else
			console.error("whoops");

		return this;
	},
	require: function(token){
		var module = new this.constructor(token);
		return module.value;
	},
	request: function(){
		this.queued = false;
		if (!this.defined && !this.requested){
			this.script = document.createElement("script");
			this.src = this.id;
			this.script.src = this.src;

			// used in global define() function as document.currentScript.module
			// this enables anonymous modules to be defined/require without the need for an id
				// but, that means you can't concatenate it into a bundle...
			this.script.module = this;

			// this.debug("request", this.id);
			document.head.appendChild(this.script);
			this.requested = true;
		} else {
			throw "trying to re-request?"
		}
	},
	request2: function(){
		this.queued = false;
		if (!this.defined && !this.requested){
			this.xhr = new XMLHttpRequest();
			this.xhr.addEventListener("load", this.functionize.bind(this));
			this.xhr.open("GET", this.id);
			this.xhr.send();
			this.requested = true;
		} else {
			throw "trying to re-request?";
		}
	},
	requireRegExp: function(){
		return /require\s*\(['"]([^'"]+)['"]\);?/gm;
	},
	functionize: function(data){
		var re = this.requireRegExp();
		this.deps = [];
		this.deps.push(re.exec(this.xhr.responseText)[1]);
		console.log("functionize", this.xhr.responseText);
	}
});

Module.base = "modules";

Module.modules = {};

Module.get = function(id){
	return this.modules[id];
};

Module.set = function(id, module){
	this.modules[id] = module;
};


// Module.url = function(token){
// 	var a = document.createElement("a");
// 	a.href = token;
// 	return {
// 		token: token,
// 		url: a.href,
// 		host: a.host,
// 		hostname: a.hostname,
// 		pathname: a.pathname
// 	};
// };

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;

Module.params = function(fn){
	var fnStr = fn.toString().replace(STRIP_COMMENTS, '');
	var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	if (result === null)
		result = [];
	return result;
};


})();