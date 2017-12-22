;(function(){
const logger = (function(){
	const logger = function(value){
		if (typeof value === "undefined"){
			return logger.auto;
		} else if (typeof value === "function" && value.logger){
			return value;
		} else if (value){
			return logger.active;
		} else {
			return logger.inactive;
		}
	};


	const noop = function(){};

	// 3 modes
	const active = logger.active = console.log.bind(console);
	const auto = logger.auto = function(){};
	const inactive = logger.inactive = function(){};
	
	const console_methods = ["log", "group", "groupCollapsed", "groupEnd", "debug", "trace", "error", "warn", "info", "time", "timeEnd", "dir"];
	
	for (const method of console_methods){
		active[method] = console[method].bind(console);
		auto[method] = console[method].bind(console);
		inactive[method] = noop;
	}

	
	// log.if() is the magic behind the "auto" mode

	// always on
	active.if = function(cond, ...args){
		if (args.length)
			active(...args);
		return active;
	};

	// maybe on
	auto.if = function(cond, ...args){
		if (cond){
			if (args.length)
				active(...args);
			return active;
		} else {
			return inactive;
		}
	};

	// always off
	inactive.if = function(cond, ...args){
		return inactive;
	}

	// some references
	active.logger = auto.logger = inactive.logger = logger;
	active.active = auto.active = inactive.active = active;
	active.auto = auto.auto = inactive.auto = auto;
	active.inactive = auto.inactive = inactive.inactive = inactive;

	// use if (this.log === this.log.auto) to check logger mode
	
	// alias these long methods
	active.groupc = console.groupCollapsed.bind(console);
	auto.groupc = noop;
	inactive.groupc = noop;

	active.end = console.groupEnd.bind(console);
	auto.end = noop;
	inactive.end = noop;

	return logger;
})();

define.Base = class Base {

	constructor(){
		this.events = {};
		this.log = define.logger();
	}

	// get log(){
	// 	return this._log || define.logger();	
	// }

	// set log(value){
	// 	this._log = define.logger(value);
	// }

	set_log(value){
		this.log = define.logger(value);
	}

	on(event, cb){
		var cbs = this.events[event];
		if (!cbs)
			cbs = this.events[event] = [];
		cbs.push(cb);
		return this;
	}

	emit(event, ...args){
		const cbs = this.events[event];
		if (cbs && cbs.length)
			for (const cb of cbs)
				cb.apply(this, args);
		return this;
	}

	off(event, cbForRemoval){
		const cbs = this.events[event];
		if (cbs)
			for (var i = 0; i < cbs.length; i++)
				if (cbs[i] === cbForRemoval)
					cbs.splice(i, 1);
		return this;
	}
	
	assign(...args){
		for (arg of args)
			for (const prop in arg)
				this[prop] = arg[prop];
		return this;
	}

	set(...args){
		if (this._set)
			this._set(...args); // pre .set() hook

		for (const arg of args){
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
			} else if (this.set$){
				// auto apply if arg is array?
				this.set$(arg);

			// oops
			} else {
				console.warn("not sure what to do with", arg);
			}
		}

		if (this.set_)
			this.set_(...args); // post .set() hook

		return this; // important
	}

	static get events(){
		return this._events || (this._events = {});
	}

	static set events(oops){
		throw "don't";
	}

	static on(event, cb){
		var cbs = this.events[event];
		if (!cbs)
			cbs = this.events[event] = [];
		cbs.push(cb);
		return this;
	}

Base.assign(events, {
	events: {},
	extend(...args){
		const name = typeof args[0] === "string" ? args.shift() : this.name + "Ext";
		const Ext = this.extend_base(name);
		Ext.assign = this.assign;
		Ext.assign(this);
		Ext.events = {};
		Ext.prototype = Object.create(this.prototype);
		Ext.prototype.constructor = Ext;
		Ext.prototype.set(...args);
		this.emit("extended", Ext);
		return Ext;
	},
	extend_base(name){
		eval("var " + name + ";");
		var constructor = eval("(" + name + " = function(...constructs){\r\n\
			if (!(this instanceof " + name + "))\r\n\
				return new " + name + "(...constructs);\r\n\
			this.events = {};\r\n\
			return this.instantiate(...constructs);\r\n\
		});");
		return constructor;
	},

	static off(event, cbForRemoval){
		const cbs = this.events[event];
		if (cbs)
			for (var i = 0; i < cbs.length; i++)
				if (cbs[i] === cbForRemoval)
					cbs.splice(i, 1);
		return this;
	}
};

define.Module = class Module extends define.Base {

	instantiate(...args){
		return (this.get(args[0]) || this.initialize()).set(...args);
	}

	get: function(token){
		return typeof token === "string" && Module.get(this.resolve(token));
	},

	initialize(...args){
		this.ready = P();
		this.dependencies = [];
		this.dependents = [];

		return this; // see instantiate()
	}

	exec(){
		this.exports = {};

		// token ends with "/", example:
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

	import(token){
		const module = new this.constructor(this.resolve(token));
		module.register(this);

		this.dependencies.push(module);
		this.emit("dependency", module);
		
		return module.ready;
	}

	register(dependent){
		this.dependents.push(dependent);
		this.emit("dependent", dependent);

		if (!this.factory && !this.queued && !this.requested)
			this.queued = setTimeout(this.request.bind(this), 0);
	}

		return this.ready; // see import()
	},

	request(){
		this.queued = false;
		
		if (this.factory)
			throw "request wasn't dequeued";

		this.log.end();

	set_id(id){
		if (this.id && this.id !== id)
			throw "do not reset id";

		if (!this.id){
			this.id = id;
			this.url = Module.url(this.id);

			// cache me
			Module.set(this.id, this);

			this.emit("id", id);
		} else {
			// this.id && this.id === id
			// noop is ok
		}
	}


	set_token(token){
		this.token = token;
		this.set_id(this.resolve(this.token));
	}
	
	set_deps(deps){
		if (this.factory)
			throw "provide deps before factory fn";

		this.deps = deps;
	}

	set_factory(factory){
		if (this.factory)
			throw "don't re-set factory fn";

		this.factory = factory;

		this.deps = this.deps || [];

		// for anonymous modules (no id)
		this.id_from_src();

		// all the magic, right here
		this.ready.resolve(
			Promise.all(this.deps.map(dep => this.import(dep)))
				.then(args => this.exec.apply(this, args))
		);


		if (this.queued)
			clearTimeout(this.queued);
	},

	// set(value) is forwarded here, when value is non-pojo 
	set$(arg){
		if (typeof arg === "string")
			this.set_token(arg);
		else if (toString.call(arg) === '[object Array]')
			this.set_deps(arg);
		else if (typeof arg === "function")
			this.set_factory(arg);
		else if (typeof arg === "object")
			this.assign(arg);
		else if (typeof arg === "undefined"){
			// I think I had an acceptable use case for this, can't remember when it happens
			console.warn("set(undefined)?");
		}
		else
			console.error("whoops");

		return this;
	}

	static P(){
		var resolve, reject;
		
		const p = new Promise(function(res, rej){
			resolve = res;
			reject = rej;
		});

		p.resolve = resolve;
		p.reject = reject;

		return p;
	}

	request(){
		this.queued = false;
		
		if (this.factory)
			throw "request wasn't dequeued";

		if (!this.requested){
			this.script = document.createElement("script");
			this.src = this.id;
			this.script.src = this.src;
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
	},

	render(){
		this.views = this.views || [];
		const view = ModuleView({ module: this });
		this.views.push(view);
		return view;
	}
}

Module.base = "modules";

Module.modules = {};

// returns module or falsey
Module.get = function(id){
	return id && this.modules[id];
		// id can be false, or undefined?
};

Module.set = function(id, module){
	this.modules[id] = module;
};

Module.doc = new Promise((res, rej) => {
	if (/comp|loaded/.test(document.readyState)){
		res();
	} else {
		document.addEventListener("DOMContentLoaded", res);
	}

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

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

Module.params = function(fn){
	const fnStr = fn.toString().replace(STRIP_COMMENTS, '');
	var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	if (result === null)
		result = [];
	// console.log(result);
	return result;
};

}); // end

Module.Base = Base;
Module.mixin = {
	assign: Base.assign,
	events: events,

};

const is = module.exports = {
	arr: function(value){
		return toString.call(value) === '[object Array]';
		// or return Array.isArray()?
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

});
define("mixin", ["./events.js", "./set.js"], function(require, exports){
	exports.events = require("./events.js");
	exports.set = require("./set.js");
});
define("View", 
	["Base", "is"],
	function(require, exports, module){

const is = require("is");
const Base = require("Base");

/*
todo:  allow .set_classes to accept an object
View({
	classes: {
		promise_like: thing.then(...) // use first arg as boolean to add/remove "promise_like" class
		event_like: thing.on("whatever") // could return a "thenable"
	}
});

You could automatically classify any thenable property..
View(thing.on("active"))
	--> view.thing = the event
		or view.active...
	--> as a thenable, we classify the "thing" class...
*/

const View = module.exports = Base.extend({
	name: "View",
	tag: "div",
	instantiate(...args){
		this.render_el();
		this.set(...args);
		this.initialize();
	},
	initialize: function(){
		this.append_fn(this.render);
		this.init();
	},
	init: function(){},
	render: function(){},
	render_el: function(){
		if (!this.hasOwnProperty("el")){
			this.el = document.createElement(this.tag);

			View.captor && View.captor.append(this);

			this.classes && this.addClass(this.classes);
		}
	},
	// set_tag(tag){
	// 	if (tag !== this.tag){
	// 		this.tag = tag;
	// 		delete this.el;
	// 		this.render_el();
	// 	}
	// },
	set$(arg){
		if (is.pojo(arg)){
			console.error("do you even happen?");
			this.assign(arg);
		} else {
			this.append(arg);
		}
	},
	set(...args){
		var hasBeenEmptied = false;
		for (const arg of args){
			// empty once if .set() will .append()
			if (!is.pojo(arg) && !hasBeenEmptied){
				this.empty();
				hasBeenEmptied = true;
			}

			// the default .set() that we've overridden
			Base.prototype.set.call(this, arg);
		}
		return this;
	},
	append(...args){
		for (const arg of args){
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
				// DOM, str, undefined, null, etc
				this.el.append(arg);
			}
		}
		return this;
	},

	append_fn(fn){
		View.set_captor(this);
		var value = fn.call(this, this);
		View.restore_captor();

		if (is.def(value))
			this.append(value);
	},

	append_pojo(pojo){
		if (pojo.path){
			this.append_path(pojo);
		} else {
			for (var prop in pojo){
				this.append_prop(prop, pojo[prop]);
			}
		}
	},

	append_obj(obj){
		if (obj.render){
			this.append(obj.render())
		} else {
			console.warn("not sure here");
		}
	},

	append_prop(prop, value){
		var view;
		if (value && value.el){
			view = value;
		} else {
			console.log(this.tag);
			view = (new View({tag: this.tag})).append(value);
		}

		this[prop] = view
			.addClass(prop)
			.appendTo(this);

		return this;
	},

	append_path(path){
		console.warn("experimental...");
		if (is.obj(path) && path.path){
			if (path.target){
				this.path(path.target).append(this.path(path.path));
			} else {
				this.append(this.path(path.path));
			}
		}

		return this;
	},

	path(path){
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

	appendTo(view){
		if (is.dom(view)){
			view.appendChild(this.el);
		} else {
			view.append(this);
		}
		return this;
	},

	addClass(){
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

	removeClass(className){
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

	hasClass(className){
		return this.el.classList.contains(className);
	},

	attr(name, value){
		this.el.setAttribute(name, value);
		return this;
	},

	click(cb){
		this.el.addEventListener("click", cb.bind(this));
		return this;
	},

	set_click(cb){
		this.click(cb);
	},

	on(event, cb){
		var bound = cb.bind(this);
		this.el.addEventListener(event, bound);
		return bound; // so you can remove it
	},

	off(event, cb){
		this.el.removeEventListener(event, cb);
		return this; //?
	},

	empty(){
		this.el.innerHTML = "";
		return this;
	},

	focus(){
		this.el.focus();
		return this;
	},

	show(){
		this.el.style.display = "";
		return this;
	},

	styles(){
		return getComputedStyle(this.el);
	},

	// inline styles
	style(prop, value){
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

	toggle(){
		if (this.styles().display === "none")
			return this.show();
		else {
			return this.hide();
		}
	},

	index(){
		var index = 0, prev;
		// while (prev = this.el.previousElementSibling)
	},

	hide(){
		this.el.style.display = "none";
		return this;
	},

	remove(){
		this.el.parentNode && this.el.parentNode.removeChild(this.el);
		return this;
	},

	editable(remove){
		remove = (remove === false);
		const hasAttr = this.el.hasAttribute("contenteditable");

		if (remove && hasAttr){
			console.warn(this.el, "remove ce");
			this.el.removeAttribute("contenteditable");
		} else if (!remove && !hasAttr) {
			console.warn(this.el, "add ce");
			this.attr("contenteditable", true)
		}
		return this;
	},

	value(){
		// get&set?
		return this.el.innerHTML;
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

View.V = View.extend("V", {
	instantiate(...args){
		this.smart_tag(args);
		this.render_el();
		this.append(...args);
		this.initialize();
	},
	smart_tag(args){
		const token = args[0];
		if (is.str(token) && token.indexOf(" ") === -1){
			if (token.indexOf("span") === 0){
				this.tag = "span";
				this.smart_classes(token);
				args.shift();
			} else if (token.indexOf(".") === 0){
				this.smart_classes(token);
				args.shift();
			}
		}
	},
	smart_classes(token){
		this.classes = token.split(".").slice(1);
	}
});

View.Span = View.extend("Span", {
	tag: "span"
});

}); // end
