// define.js
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







// modules/is/is.js
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



// modules/Base/Base.js
define("Base", ["is", "server"], function(is, server){
	// for convenience
	window.is = is;
	window.log = define.log;
	window.logger = define.logger;
	window.server = server;

	return define.Base;
});



// modules/mixin/events.js
define("mixin/events.js", function(){

return {
	on: function(event, cb){
		this.events = this.events || {}; // init, if not already present
		var cbs = this.events[event] = this.events[event] || [];
		cbs.push(cb);
		return this;
	},
	emit: function(event){
		var cbs = this.events && this.events[event];
		if (cbs && cbs.length){
			for (var i = 0; i < cbs.length; i++){
				cbs[i].apply(this, [].slice.call(arguments, 1));
			}
		} else {
			console.warn("no events registered for", event);
		}
		return this;
	}
};

});




// modules/mixin/mixin.js
define("mixin", ["mixin/events.js"], function(events){
	return {
		events: events
	};
});



// modules/Base2/Base2.js
define("Base2", ["Base"], 

// {log: true},

function(Base){

	var Base2 = Base.extend({
		log: define.logger(false),
		assign: Base.assign,
		instantiate: function(){}
	}).assign({
		config: function(instance, options){
			if (options && is.def(options.log)){
				// pass { log: true/false/another } into constructor as first option
				instance.log = define.logger(options.log);
				delete options.log;
			} else {
				// you could assign true/false to the prototype
				instance.log = define.logger(instance.log); 
			}
		}
	});

	Base2.extend = function(){
		var Ext = function Ext(o){
			if (!(this instanceof Ext))
				return new (Ext.bind.apply(Ext, [null].concat([].slice.call(arguments))));
			Ext.config(this, o);
			this.instantiate.apply(this, arguments);
		};
		Ext.assign = this.assign;
		Ext.assign(this);
		Ext.prototype = Object.create(this.prototype);
		Ext.prototype.constructor = Ext;
		Ext.prototype.assign.apply(Ext.prototype, arguments);
		return Ext;
	};

	return Base2;

});



// modules/View/View.js
define("View", ["Base2"], function(Base2){

var View = Base2.extend({
	tag: "div",
	instantiate: function(){
		this.constructs.apply(this, arguments);
		this.initialize();
	},
	initialize: function(){
		// if we pass constructs that are non-pojos, they get appended
		// in order to append, we have to render_el earlier
		// but we don't want to always render_el before assigning pojos, because then we can't change the .tag
		if (!this.el) this.render_el();
		this.append(this.render);
		this.init();
	},
	init: function(){},
	render: function(){},
	render_el: function(){
		if (!this.el){
			this.el = document.createElement(this.tag);

			View.captor && View.captor.append(this);

			// if (this.name)
			// 	this.addClass(this.name);

			// if (this.type)
			// 	this.addClass(this.type);

			this.classes && this.addClass(this.classes);
		}
	},
	constructs: function(){
		var arg;
		for (var i = 0; i < arguments.length; i++){
			arg = arguments[i];
			if (is.pojo(arg)){
				this.assign(arg);
			} else {
				if (!this.el) this.render_el();
				this.append(arg);
			}
		}
	},
	set: function(){
		this.empty();
		this.append.apply(this, arguments);
		return this;
	},
	append: function(){
		var arg;
		for (var i = 0; i < arguments.length; i++){
			arg = arguments[i];
			if (arg && arg.el){
				arg.parent = this;
				this.el.appendChild(arg.el);
			} else if (is.pojo(arg)){
				this.append_pojo(arg);
			} else if (is.arr(arg)){
				this.append.apply(this, arg);
			} else if (is.fn(arg)){
				this.append_fn(arg);
			} else {
				// DOM, str, etc
				this.el.append(arg);
			}
		}
		return this;
	},
	append_fn: function(fn){
		View.set_captor(this);
		var value = fn.call(this, this);
		View.restore_captor();

		if (is.def(value))
			this.append(value);
	},
	append_pojo: function(pojo){
		var value, view;
		for (var prop in pojo){
			value = pojo[prop];
			if (value && value.el){
				view = value;
			} else if (!value){
				// false, undefined, or otherwise falsy
				continue;
			} else {
				view = View().append(value);
			}
			this[prop] = view
				.addClass(prop)
				.appendTo(this);
		}
	},
	appendTo: function(view){
		view.append(this);
		return this;
	},
	addClass: function(){
		var arg;
		for (var i = 0; i < arguments.length; i++){
			arg = arguments[i];
			if (is.arr(arg))
				this.addClass.apply(this, arg);
			else if (arg.indexOf(" ") > -1)
				this.addClass.apply(this, arg.split(" "));
			else
				this.el.classList.add(arg);
		}
		return this;
	},
	removeClass: function(className){
		var arg;
		for (var i = 0; i < arguments.length; i++){
			arg = arguments[i];
			if (is.arr(arg))
				this.removeClass.apply(this, arg);
			else if (arg.indexOf(" ") > -1)
				this.removeClass.apply(this, arg.split(" "));
			else
				this.el.classList.remove(arg);
		}
		return this;
	},
	hasClass: function(className){
		return this.el.classList.contains(className);
	},
	attr: function(name, value){
		this.el.setAttribute(name, value);
		return this;
	},
	click: function(cb){
		this.el.addEventListener("click", cb.bind(this));
		return this;
	},
	on: function(event, cb){
		var bound = cb.bind(this);
		this.el.addEventListener(event, bound);
		return bound; // so you can remove it
	},
	off: function(event, cb){
		this.el.removeEventListener(event, cb);
		return this; //?
	},
	empty: function(){
		this.el.innerHTML = "";
		return this;
	},
	focus: function(){
		this.el.focus();
		return this;
	},
	show: function(){
		this.el.style.display = "";
		return this;
	},
	styles: function(){
		return getComputedStyle(this.el);
	},
	// inline styles
	style: function(prop, value){
		// set with object
		if (is.obj(prop)){
			for (var p in prop){
				this.style(p, prop[p]);
			}
			return this;

		// set with "prop", "value"
		} else if (prop && is.def(value)) {
			this.el.style[prop] = value;
			return this;

		// get with "prop"
		} else if (prop) {
			return this.el.style[prop];

		// get all
		} else if (!arguments.length){
			return this.el.style;
		} else {
			throw "whaaaat";
		}
	},
	toggle: function(){
		if (this.styles().display === "none")
			return this.show();
		else {
			return this.hide();
		}
	},
	hide: function(){
		this.el.style.display = "none";
		return this;
	},
	remove: function(){
		this.el.parentNode.removeChild(this.el);
		return this;
	}
});

View.assign({
	previous_captors: [],
	set_captor: function(view){
		this.previous_captors.push(this.captor);
		this.captor = view;
	},
	restore_captor: function(){
		this.captor = this.previous_captors.pop();
	}
});

return View;

});



// modules/Test/Test.js
define("Test", ["Base2", "View"], function(Base2, View){

	var stylesheet = View({tag: "link"})
		.attr("rel", "stylesheet")
		.attr("href", "/simple/modules/Test/Test.css");
	document.head.appendChild(stylesheet.el);



	var TestView = View.extend({

	});

	var body = View({
		el: document.body
	});

	var Test = Base2.extend({
		instantiate: function(name, fn){
			this.name = name;
			this.fn = fn;

			this.pass = 0;
			this.fail = 0;

			this.container = this.container || body;

			this.initialize();
		},
		initialize: function(){
			if (this.shouldRun())
				this.render();
		},
		render: function(){
			this.view = View().addClass('test').append({
				bar: View(this.label()).click(this.activate.bind(this)),
				content: View(this.exec.bind(this)),
				footer: View()
			});

			this.view.addClass("active");

			if (this.pass > 0)
				this.view.footer.append("Passed " + this.pass);
			if (this.fail > 0)
				this.view.footer.append("Failed " + this.fail);

			if (!this.view.parent)
				this.view.appendTo(this.container);
		},
		activate: function(){
			window.location.hash = this.name;
			window.location.reload();
		},
		label: function(){
			return (this.match() ? "#" : "") + this.name;
		},
		exec: function(){
			console.group(this.label());
			
			Test.set_captor(this);

				// run the test
				this.fn();

			Test.restore_captor();
			console.groupEnd();
		},
		assert: function(value){
			if (value){
				this.pass++;
			} else {
				console.error("Assertion failed");
				this.fail++;
			}
		},
		shouldRun: function(){
			return !window.location.hash || this.match();
		},
		match: function(){
			return window.location.hash.substring(1) === this.name;
		}
	});

	Test.assign({
		previous_captors: [],
		set_captor: function(view){
			this.previous_captors.push(this.captor);
			this.captor = view;
		},
		restore_captor: function(){
			this.captor = this.previous_captors.pop();
		},
		assert: function(value){
			if (Test.captor)
				Test.captor.assert(value);
			else
				console.error("whoops");
		},
		controls: function(){
			var controls = View().addClass("test-controls").append({
				reset: View({tag:"button"}, "reset").click(function(){
					Test.reset();
				})
			});
			document.body.appendChild(controls.el);
		},
		reset: function(){
			window.location.href = window.location.href.split('#')[0];
		}
	});

	window.addEventListener("hashchange", function(){
		window.location.reload();
	});
	console.warn("auto refresh on window.hashchange event?");

	return Test;
});



// modules/server/server.js
define("server", function(){
	var log = define.logger(true);

	var server = new WebSocket("ws://" + window.location.host);

	server.addEventListener("open", function(){
		log("server connected");
	});

	server.addEventListener("message", function(e){
		if (e.data === "reload"){
			window.location.reload();
		} else {
			log("message from server", e);
		}
	});

	return server;
})



// modules/simple/simple.js
define("simple",

[ "is", "mixin", "Base2", "View", "Test", "server"],

function(is, mixin, Base2, View, Test, server){

	window.Base = define.Base;
	window.log = define.log;

	window.is = is;
	window.mixin = mixin;
	window.Base2 = Base2;
	window.View = View;
	window.Test = Test;

	["h1", "h2", "h3", "p", "section", "aside", "article", "ul", 
		"li", "ol", "nav", "span", "a", "em", "strong"].forEach(function(tag){
		window[tag] = View.extend({
			tag: tag
		});
	});

	window.server = server

	// server.log("log");
	// server.log.info("info");
	// server.log.debug("debug");
	// server.log.warn("warn");
	// server.log.error("error");

	console.log("so simple");
	return "so simple";
});



