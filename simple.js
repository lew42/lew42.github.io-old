/*
 * window.define
 */

;(function(log){
	
var Base = function(){
	this.instantiate.apply(this, arguments);
};

var assign = Base.assign = Base.prototype.assign = function(){
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

Base.extend = function(){
	var Ext = function(){
		this.instantiate.apply(this, arguments);
	};
	Ext.assign = this.assign;
	Ext.assign(this);
	Ext.prototype = Object.create(this.prototype);
	Ext.prototype.constructor = Ext;
	Ext.prototype.assign.apply(Ext.prototype, arguments);

	return Ext;
};


var Module = Base.extend({
	instantiate: function(id){
		this.id = id;
		
		this.log = define.log;
		this.debug = define.debug;

		this.deps = []; // dependencies (Module instances)
		this.dependents = [];

		this.views = [];
	},
	define: function(fn, deps){
		this.debug.group("define", this.id, deps || []);

		this.factory = fn;

		if (deps)
			deps.forEach(this.require.bind(this));

		this.defined = true;

		this.exec();

		this.debug.end();
	},
	require: function(id){
		var module = define.get(id);

		// all deps
		this.deps.push(module);

		// deps track dependents, too
		module.dependents.push(this);
	},
	/**
	 * All requests get delayed.  See define(), define.delayRequests(), and define.requests()
	 */
	request: function(){
		if (!this.defined && !this.requested){
			this.script = document.createElement("script");
			this.script.src = define.resolve(this.id);

			// used in global define() function as document.currentScript.module
			this.script.module = this;

			this.debug("request", this.id);
			this.requested = true;
			document.head.appendChild(this.script);
		}
	},
	exec: function(){
		this.debug.group("ping", this.id);

		if (this.executed){
			this.debug("already executed");
			// this happens when the "finish" loop has a dependency that will be pinged later in the loop, but also gets pinged earlier in the loop, due to multiple dependents
				// essentially, if b depends on a, and c depends on a, but c also depends on b, then what happens is
				// a finishes
				// a begins finish loop to notify b and c
				// b is notified first, and when complete, pings c
				// when c is pinged, at this point, a is finished, so c is executed synchronously
				// after c's finish loop, we fall back to the original a.finish that we started with
				// in a's finish loop, we just pinged b, now we ping c
				// here's where the second .exec came in
			// i originally thought that .exec wouldn't be called twice
			// but, unless I setTimeout 0 on the .execs...
			return false;
		}

		var args = this.args();
		
		if (args){
			!this.dependents.length && 
				this.log.group(this.id, this.deps.map(function(dep){ return dep.id }));
			this.value = this.factory.apply(null, args);
			this.executed = true;
			!this.dependents.length && 
				this.log.end();
			this.finish();
		} else {
			this.debug(this.id, "not ready");
		}
		this.debug.end();
	},
	finish: function(){
		this.debug.group(this.id, "finished");
		for (var i = 0; i < this.dependents.length; i++){
			this.debug("dependent", this.dependents[i].id, "exec()");
			this.dependents[i].exec();
		}
		this.debug.end();
		this.finished = true;
	},
	args: function(){
		var dep, args = [];
		for (var i = 0; i < this.deps.length; i++){
			dep = this.deps[i];
			if (dep.executed){
				args.push(dep.value);
			} else {
				this.debug("awaiting", dep.id);
				return false;
			}
		}
		return args;
	},
	render: function(){
		var view;
		if (this.View){
			view = new this.View({
				module: this
			});
			this.views.push(view);
			return view;
		}
		return false;

		// then

		this.views.forEach((view) => view.update());
	}
});

var define = window.define = function(){
	var args = define.args(arguments);
	var script = document.currentScript; 
	var module;
	var a;

	if (args.id){
		module = define.get(args.id);
	} else if (script && script.module){
		module = script.module;
	} else {
		a = document.createElement("a");
		a.href = script.src;
		module = new define.Module(a.pathname);
	}

	define.delayRequests();

	return module.define(args.factory, args.deps);
};

define.assign = assign;

define.assign({
	log: log,
	debug: log.off,
	modules: {},
	moduleRoot: "modules",
	Module: Module, // see .get()
	delayRequests: function(){
		define.debug.time("define.requests timeout");
		if (define.delayRequestsTimeout){
			clearTimeout(define.delayRequestsTimeout);
		}
		define.delayRequestsTimeout = setTimeout(define.requests, 0);
	},
	get: function(id){
		return (define.modules[id] = define.modules[id] || new define.Module(id));
	},
	args: function(argu){
		var arg, args = {};
		for (var i = 0; i < argu.length; i++){
			arg = argu[i];
			if (typeof arg === "string")
				args.id = arg;
			else if (toString.call(arg) === '[object Array]')
				args.deps = arg;
			else if (typeof arg === "function")
				args.factory = arg;
			else
				console.error("whoops");
		}
		return args;
	},
	requests: function(){
		define.debug.g("define.requests", function(){
			define.debug.timeEnd("define.requests timeout");
			for (var i in define.modules){
				define.modules[i].request();
			}
		});
	},
	resolve: function(id){
		var parts = id.split("/"); // id could be //something.com/something/?
		
		if (id[id.length-1] === "/"){
			// ends in "/", mimic last part
			id = id + parts[parts.length-2] + ".js";
		} else if (parts[parts.length-1].indexOf(".js") < 0){
			// only supports .js files
			id = id + ".js";
		}

		// convert non-absolute paths to moduleRoot paths
		if (id[0] !== "/"){
			id = "/" + define.moduleRoot + "/" + id;
		}

		return id;
	}
});


// define.Base = Base;
define.log = define.log.off;
define("Base", function(){
	return Base;
});

define("is", function(){
	return is;
});

define("log", function(){
	return log;
});
define.log = define.log.on;



})(/*logger goes here);*/
define("devsocket", [], function(){

var ws = window.socket = new WebSocket("ws://localhost");

ws.addEventListener("open", function(e){
	console.log("websocket connected");
});

ws.addEventListener("message", function(e){
	console.log("message", e);
	if (e.data === "reload"){

		window.location.reload();
	}
});

}); // yee haw
;(function(){


var is = window.is = {
	arr: function(value){
		return toString.call(value) === '[object Array]';
	},
	obj: function(value){
		return typeof value === "object" && !is.arr(value);
	},
	dom: function(value){
		return value && value.nodeType > 0;
	},
	el: function(value){
		return value && value.nodeType === 1;
	},
	str: function(value){
		return typeof value === "string";
	},
	num: function(value){
		return typeof value === "number";
	},
	bool: function(value){
		return typeof value === 'boolean';
	},
	fn: function(value){
		return typeof value === 'function';
	},
	def: function(value){
		return typeof value !== 'undefined';
	},
	undef: function(value){
		return typeof value === 'undefined';
	},
	/// seems to work
	pojo: function(value){
		return is.obj(value) && value.constructor === Object;
	},
	proto: function(value){
		return is.obj(value) && value.constructor && value.constructor.prototype === value;
	}
};

})();(function(){

var console_methods = ["log", "group", "debug", "trace", "error", "warn", "info", "time", "timeEnd"];

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

var enabled_logger = make_enabled_logger();
enabled_logger.on = enabled_logger;

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
	
	return disabled_logger;
};

enabled_logger.off = make_disabled_logger();
enabled_logger.off.on = enabled_logger;


return enabled_logger;
})());