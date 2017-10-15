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

})(define, define.assign);




// 4_log.js
(function(define){

	var console_methods = ["log", "group", "debug", "trace", "error", "warn", "info", "time", "timeEnd", "dir"];

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

})(define)



// 5_Module.js
;(function(define, Base, log, debug){

	var Module = define.Module = Base.extend({
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
				// !this.dependents.length && 
					this.log.group(this.id, this.deps.map(function(dep){ return dep.id }));
				this.value = this.factory.apply(null, args);
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
define("Base", ["is"], function(is){
	// for convenience
	window.is = is;
	window.log = define.log;

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
define("Base2", ["Base"], function(Base){

	var Base2 = Base.extend({
		log: log.off, // log is globalized by simple/modules/Base
		assign: Base.assign,
		instantiate: function(){}
	});

	Base2.extend = function(){
		var Ext = function Ext(){
			if (!(this instanceof Ext))
				return new (Ext.bind.apply(Ext, [null].concat([].slice.call(arguments))));
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
	},
	render: function(){},
	render_el: function(){
		if (!this.el){
			this.tag = this.tag || "div";
			this.el = document.createElement(this.tag);

			View.captor && View.captor.append(this);

			// if (this.name)
			// 	this.addClass(this.name);

			// if (this.type)
			// 	this.addClass(this.type);

			if (this.classes){
				if (is.arr(this.classes))
					this.addClass.apply(this, this.classes);
				else if (is.str(this.classes))
					this.addClass.apply(this, this.classes.split(" "));
			}
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
		for (var i = 0; i < arguments.length; i++){
			this.el.classList.add(arguments[i]);
		}
		return this;
	},
	attr: function(name, value){
		this.el.setAttribute(name, value);
		return this;
	},
	click: function(cb){
		this.el.addEventListener("click", cb.bind(this));
		return this;
	},
	removeClass: function(className){
		this.el.classList.remove(className);
		return this;
	},
	hasClass: function(className){
		return this.el.classList.contains(className);
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
	style: function(){
		return getComputedStyle(this.el);
	},
	toggle: function(){
		if (this.style().display === "none")
			return this.show();
		else {
			return this.hide();
		}
	},
	hide: function(){
		this.el.style.display = "none";
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
define("Test", ["Base2", "View", "Server"], function(Base2, View){

	var stylesheet = View({tag: "link"})
		.attr("rel", "stylesheet")
		.attr("href", "/" + define.moduleRoot + "/Test/Test.css");
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
			this.render();
			this.exec();
		},
		render: function(){
			this.view = View().addClass('test').append({
				bar: View(this.label()).click(this.activate.bind(this)),
				content: View(),
				footer: View()
			});

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
			if (this.shouldRun()){
				this.view.addClass("active");
				console.group(this.label());
				
				Test.set_captor(this);

				this.view.content.append(function(){
					this.fn();
				}.bind(this));

				Test.restore_captor();
				
				if (this.pass > 0)
					this.view.footer.append("Passed " + this.pass);
				if (this.fail > 0)
					this.view.footer.append("Failed " + this.fail);
				console.groupEnd();
			}
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

	return Test;
});



// modules/Server/Server.js
define("Server", ["Base2"], function(Base2){

	var Server = Base2.extend({
		instantiate: function(){
			this.constructs.apply(this, arguments);
			this.initialize();
		},
		constructs: function(o){
			if (o && is.def(o.log)){
				if (o.log){
					this.log = this.log.on;
				} else {
					this.log = this.log.off;
				}
			}
		},
		initialize: function(){
			this.socket = new WebSocket("ws://" + window.location.host);

			this.socket.addEventListener("open", function(){
				this.log("server.socket connected");
			}.bind(this));

			this.socket.addEventListener("message", function(e){
				if (e.data === "reload"){
					window.location.reload();
				} else {
					this.log("message from server.socket", e);
				}
			}.bind(this));
		}
	});

	window.server = new Server({ log: true });

	return Server;
})



// modules/simple/simple.js
define("simple",

[ "is", "mixin", "Base2", "View", "Test", "Server"],

function(is, mixin, Base2, View, Test, Server){

	window.Base = define.Base;
	window.log = define.log;

	window.is = is;
	window.mixin = mixin;
	window.Base2 = Base2;
	window.View = View;
	window.Test = Test;

	window.server = new Server({
		log: true
	});

	// server.log("log");
	// server.log.info("info");
	// server.log.debug("debug");
	// server.log.warn("warn");
	// server.log.error("error");

	return "so simple";
});



