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

		return module.define(args.factory, args.deps);
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

})(define, define.assign, define.Module, define.log);(function(define){

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

define.log = enabled_logger;
define.debug = define.log.off;

})(define));



/*/home/michael/Code/lew42.com/simple/docs/modules/devsocket.js*/
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

	return ws

});


/*/home/michael/Code/lew42.com/simple/docs/modules/is.js*/
define("is", function(){
	
	var is = {
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

	return is;
});