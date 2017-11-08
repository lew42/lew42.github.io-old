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
console.timeEnd("docReady");
console.time("document.ready");
Module("docReady", function(){
	var ready = function(){
		Module("document.ready", function(){
			console.timeEnd("document.ready");
			return true;
		});
	};


	if (/comp|loaded/.test(document.readyState)){
		console.warn("already ready?");
		ready();
	} else {
		document.addEventListener("DOMContentLoaded", ready);
	}
});
Module("is", function(){

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
Module("Base", ["is", "server"], function(require){
	var is = require("is");
	var server = require("server");

	// for convenience
	window.is = is;
	window.server = server;

	return Base;
});
Module("mixin/events.js", function(){

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

Module("mixin", ["mixin/events.js"], function(events){
	return {
		events: events
	};
});
Module("Base2", ["Base"], 

// {log: true},

function(require){
	var Base = require("Base");
	var Base2 = Base.extend({
		log: logger(false),
		assign: Base.assign,
		instantiate: function(){}
	}).assign({
		config: function(instance, options){
			if (options && is.def(options.log)){
				// pass { log: true/false/another } into constructor as first option
				instance.log = logger(options.log);
				delete options.log;
			} else {
				// you could assign true/false to the prototype
				instance.log = logger(instance.log); 
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
Module("View", ["Base2"], function(require){
var Base2 = require("Base2");
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
			} else if (is.obj(arg)){
				this.append_obj(arg);
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
		if (pojo.path){
			this.append_path(pojo);
		} else {
			for (var prop in pojo){
				this.append_prop(prop, pojo[prop]);
			}
		}
	},
	append_obj: function(obj){
		if (obj.render){
			this.append(obj.render())
		} else {
			console.warn("not sure here");
		}
	},
	append_prop: function(prop, value){
		var view;
		if (value && value.el){
			view = value;
		} else if (!value){
			// false, undefined, or otherwise falsy
			// why?  why not append value.toString() ?
			/*
			if you: render(){ 
				this.append({
					icon: this.icon
				});
			}, and then you set Thing({ icon: false }),
			you don't really want to append "false",
			you want to append nothing...
			*/
			return this;
		} else {
			view = View().append(value);
		}

		this[prop] = view
			.addClass(prop)
			.appendTo(this);

		return this;
	},
	append_path: function(path){
		if (is.obj(path) && path.path){
			if (path.target){
				this.path(path.target).append(this.path(path.path));
			} else {
				this.append(this.path(path.path));
			}
		}

		return this;
	},
	path: function(path){
		var parts, value = this;
		if (is.str(path)){
			parts = path.split(".");
		} else if (is.arr(path)) {
			parts = path;
		}

		if (parts[0] === ""){
			parts = parts.slice(1);
		}

		if (parts[parts.length - 1] === ""){
			console.warn("forgot how to do this");
		}

		for (var i = 0; i < parts.length; i++){
			value = value[parts[i]];
		}

		return value;
	},
	appendTo: function(view){
		if (is.dom(view)){
			view.appendChild(this.el);
		} else {
			view.append(this);
		}
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
Module("Test", ["Base2", "View"], function(require){

	var Base2 = require("Base2");
	var View = require("View");
	
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
				content: View(),
				footer: View()
			});

			this.view.content.append(this.exec.bind(this));

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
Module("server", function(){
	var log = logger(true);

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
Module("simple",

[ "is", "mixin", "Base2", "View", "Test", "server", "docReady"],

function(require){

	var is = require("is");
	var mixin = require("mixin");
	var Base2 = require("Base2");
	var View = require("View");
	var Test = require("Test");
	var server = require("server");

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