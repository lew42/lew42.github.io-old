// 1_define_root.js
define = function(){
	return define.define.apply(define, arguments);
};



// 2_assign.js
define.assign = function(){
	var arg;
	for (var i = 0; i < arguments.length; i++){
		arg = arguments[i];
		for (var prop in arg){
			this[prop] = arg[prop];
		}
	}
	return this;
};



// 3_Base.js
;(function(define, assign){

	var Base = define.Base = function(){
		this.instantiate.apply(this, arguments);
	};

	Base.assign = Base.prototype.assign = assign;

	Base.prototype.instantiate = function(){};

	Base.assign({
		extend: function(){
			var Ext = function(){
				this.instantiate.apply(this, arguments);
			};
			Ext.assign = this.assign;
			Ext.assign(this);
			Ext.prototype = Object.create(this.prototype);
			Ext.prototype.constructor = Ext;
			Ext.prototype.assign.apply(Ext.prototype, arguments);

			return Ext;
		}
		
	});

})(define, define.assign);




// 4_logger.js
(function(define){

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

	var logger = define.logger = function(value){
		if (typeof value === "function" && value.isLogger){
			return value;
		} else if (value){
			return enabled_logger;
		} else {
			return disabled_logger;
		}
	};

	define.log = logger(false);
	define.debug = logger(false);

})(define)



// 5_Module.js
;(function(define, Base, log, debug){

	var Module = define.Module = Base.extend({
		instantiate: function(id){
			this.id = id;
			
			this.log = define.log;
			this.debug = define.debug;

			this.dependencies = []; // dependencies (Module instances)
			this.dependents = [];

			this.views = [];
		},
		fixLoggers: function(){
			if (typeof this.log === "boolean"){
				this.log = this.log ? define.log.on : define.log.off;
			}

			if (typeof this.debug === "boolean"){
				this.debug = this.debug ? define.log.on : define.log.off;
			}
		},
		define: function(args){
			this.assign(args);
			this.fixLoggers();

			this.debug.group("define", this.id, this.deps || []);

			if (this.deps)
				this.deps.forEach(this.require.bind(this));

			this.defined = true;

			this.exec();

			this.debug.end();
		},
		require: function(id){
			var module = define.get(id);

			// all deps
			this.dependencies.push(module);

			// deps track dependents, too
			module.dependents.push(this);

			if (this.debug.enabled){
				module.log = this.debug;
				module.debug = this.debug;
			}
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
		path: function(){
			var a = document.createElement("a");
			a.href = this.script.src;
			if (this.requested){
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
				this.log.group(this.id, this.dependencies.map(function(dep){ return dep.id }));
				this.value = this.factory.apply(this, args);
				this.executed = true;
				// !this.dependents.length && 
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
			for (var i = 0; i < this.dependencies.length; i++){
				dep = this.dependencies[i];
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

})(define, define.Base, define.log, define.debug);



// 6_define.js
;(function(define, assign, Module, log){
	
	define.assign({
		Module: Module,
		log: log,
		debug: log.off,
		modules: {},
		moduleRoot: "modules",
		define: function(){
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

			return module.define(args);
		},
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
		/// "impure" ?
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
				else if (typeof arg === "object")
					assign.call(args, arg); /// NOTE: external reference to `assign()`
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

			// change this to default mimic
			// require "thing" --> thing/thing.js
			// require "thing.js" --> thing.js
			// require "thing/" --> thing/index?
			
			// "thing/"
			if (id[id.length-1] === "/"){
				// ends in "/", mimic last part --> "thing/thing.js"
				id = id + parts[parts.length-2] + ".js";

			// does not contain ".js", "thing"
			} else if (parts[parts.length-1].indexOf(".js") < 0){
				id = id + "/" + parts[parts.length-1] + ".js";
			}

			// convert non-absolute paths to moduleRoot paths
			if (id[0] !== "/"){
				id = "/" + define.moduleRoot + "/" + id;
			}

			return id;
		}
	});

})(define, define.assign, define.Module, define.log);



