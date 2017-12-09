;(function(){
;(function(){
	const logger = function(value){
		if (typeof value === "function" && value.logger){
			return value;
		} else if (value){
			return logger.active;
		} else {
			return logger.inactive;
		}
	};

	const console_methods = ["log", "group", "groupCollapsed", "debug", "trace", 
		"error", "warn", "info", "time", "timeEnd", "dir"];

	const inactive = function(){};

	const active = logger.active = console.log.bind(console);
	const inactive = logger.inactive = function(){};
	
	active.logger = inactive.logger = logger;
	
	active.active = inactive.active = active;
	inactive.inactive = active.inactive = inactive;

	active.is_active = true;
	inactive.is_active = false;
	
	for (const method of console_methods){
		active[method] = console[method].bind(console);
		inactive[method] = noop;
	}

	active.groupc = console.groupCollapsed.bind(console);
	active.end = console.groupEnd.bind(console);

	inactive.groupc = noop;
	inactive.end = noop;
})();
const P = window.P = function(){
	var resolve, reject;
	const p = new Promise(function(res, rej){
		resolve = res;
		reject = rej;
	});

	p.resolve = $resolve;
	p.reject = $reject;

	return p;
};
const events = {
	on(event, cb){
		var cbs = this.events[event];
		if (!cbs)
			cbs = this.events[event] = [];
		cbs.push(cb);
		return this;
	},
	emit(event, ...args){
		const cbs = this.events[event];
		if (cbs && cbs.length)
			for (const cb of cbs)
				cb.apply(this, ...args);
		return this;
	},
	off: function(event, cbForRemoval){
		const cbs = this.events[event];
		if (cbs)
			for (var i = 0; i < cbs.length; i++)
				if (cbs[i] === cbForRemoval)
					cbs.splice(i, 1);
		return this;
	}
};
const set = function(...args){
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
};
// logger()
// set
// 

const Base = function(...constructs){
	if (!(this instanceof Base))
		return new Base(...constructs);
	this.events = {};
	return this.instantiate(...constructs);
};

Base.assign = Base.prototype.assign = function(...args){
	for (arg of args)
		for (const prop in arg)
			this[prop] = arg[prop];
	return this;
};

Base.prototype.assign(events, {
	instantiate(){},
	set: set,
	log: logger(),
	set_log(value){
		this.log = logger(value);
	}
});

Base.assign(events, {
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

});
const debug = false;

const Module = window.Module = Base.extend("Module", {
	base: "modules",
	debug: logger(debug),
	log: logger(false || debug),

	instantiate(...args){
		return (this.get(args[0]) || this.initialize()).set(...args);
	},

	get: function(token){
		return is.str(token) && Module.get(this.resolve(token));
	},

	initialize(...args){
		this.ready = P();
		this.dependencies = [];
		this.dependents = [];

		return this; // see instantiate()
	},

	resolve(token){
		const parts = token.split("/");

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

		return token; // the transformed token is now the id
	},

	import(token){
		return (new this.constructor(this.resolve(token))).register(this);
	},

	register(dependent){
		this.dependents.push(dependent);

		if (!this.factory && !this.queued && !this.requested){
			this.queued = setTimeout(this.request.bind(this), 0);
		}

		return this.ready; // see import()
	},

	exec(){
		const params = Module.params(this.factory);

		this.log.group(this.id);
		
			// call the .factory
			if (params[0] === "require")
				this.exec_common()
			else
				this.exports = this.factory.apply(this, arguments)

		this.log.end();

		return this.exports;
	},

	exec_common(){
		this.exports = {};
		const ret = this.factory.call(this, this.require.bind(this), this.exports, this);
		if (typeof ret !== "undefined")
			this.exports = ret;
	}

	set_id(id){
		if (this.id && this.id !== id)
			throw "do not reset id";

		if (!this.id){
			this.id = id;

			// cache me
			Module.set(this.id, this);
		} else {
			// this.id && this.id === id
			// noop ok
		}
	},

	id_from_src(){
		if (!this.id){
			const a = document.createElement("a");
			a.href = document.currentScript.src;

			this.set({
				id: a.pathname,
				log: true // might need to be adjusted
			})
		}
	},

	set_token(token){
		this.token = token;
		this.set_id(this.resolve(this.token));
	},
	
	set_deps(deps){
		if (this.factory)
			throw "provide deps before factory fn";

		this.deps = deps;
	},

	set_factory(factory){
		if (this.factory)
			throw "don't re-set factory fn";

		this.factory = factory;

		this.deps = this.deps || [];

		// all the magic, right here
		this.ready.resolve(
			Promise.all(this.deps.map(dep => this.import(dep)))
				.then(args => this.exec.apply(this, args))
		);

		// for anonymous modules (no id)
		this.id_from_src();
		
		// 
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
	},


	set_debug(value){
		this.debug = logger(value);
		this.log = logger(value);
	},

	require(token){
		const module = this.get(token);
		if (!module)
			throw "module not preloaded";
		return module.exports;
	},

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
});

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
});

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


Module.Base = Base;
Module.mixin = {
	assign: Base.assign,
	events: events,

};
})();
Module("is", function(require, exports, module){

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
Module("View", function(require, exports, module){

const View = module.exports = Base.extend({
	name: "View",
	tag: "div",
	instantiate(...args){
		this.set(...args);
		this.initialize();
	},
	initialize: function(){
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
	set$(arg){
		if (is.pojo(arg)){
			this.assign(arg);
		} else {
			this.append(arg);
		}
	},
	set(...args){
		this.render_el(); // in case it hasn't been
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
	append: function(){
		var arg;

		if (!this.el) this.render_el();

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
				// DOM, str, undefined, null, etc
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
	index: function(){
		var index = 0, prev;
		// while (prev = this.el.previousElementSibling)
	},
	hide: function(){
		this.el.style.display = "none";
		return this;
	},
	remove: function(){
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

});