define = function(...args){
	return new define.Module(...args);
};

define.path = "modules";

define.P = function(){
	var resolve, reject;
	
	const p = new Promise(function(res, rej){
		resolve = res;
		reject = rej;
	});

	p.resolve = resolve;
	p.reject = reject;

	return p;
};

define.logger = (function(){
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

	static emit(event, ...args){
		const cbs = this.events[event];
		if (cbs && cbs.length)
			for (const cb of cbs)
				cb.apply(this, args);
		return this;
	}

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

	constructor(...args){
		super();
		this.debug = define.logger(this.log);
		return (this.get(args[0]) || this.initialize()).set(...args);
	}

	get(token){
		return typeof token === "string" && this.constructor.get(this.resolve(token));
	}

	initialize(...args){
		this.ready = this.constructor.P();
		this.dependencies = [];
		this.dependents = [];

		return this; // see instantiate()
	}

	exec(){
		this.exports = {};

		this.emit("pre-exec");

		// log if no dependents
		const log = this.log.if(!this.dependents.length);
		
		log.group(this.id);
		const ret = this.factory.call(this.ctx || this, this.require.bind(this), this.exports, this);
		log.end();

		if (typeof ret !== "undefined")
			this.exports = ret;

		this.emit("executed");

		return this.exports;
	}

	// `this.token` is transformed into `this.id`
	// todo: pass { id: "..." } to if already resolved...
	resolve(token){ 
		var id, 
			parts;

		// mimic the base path
		if (token === "."){
			if (!this.url)
				throw "don't define with relative tokens";

			parts = this.url.path.split("/");
			id = this.url.path + parts[parts.length-2] + ".js";
		} else {
			parts = token.split("/");

			// token ends with "/", ex: "path/thing/"
			if (token[token.length-1] === "/"){
				// repeat last part, ex: "path/thing/thing.js"
				id = token + parts[parts.length-2] + ".js";

			// last part doesn't contain a ".", ex: "path/thing"
			} else if (parts[parts.length-1].indexOf(".") < 0){
				// repeat last part, add ".js", ex: "path/thing/thing.js"
				id = token + "/" + parts[parts.length-1] + ".js";
			} else {
				id = token;
			}

			if (id.indexOf("./") === 0){
				if (!this.url)
					throw "don't define with relative tokens";
				id = this.url.path + id.replace("./", "");
				// token = token.replace("./", ""); // nope - need to parse id->host/path
			} else if (id[0] !== "/"){
				id = "/" + define.path + "/" + id;
			}
		}

		this.debug(this.id, ".resolve(", token, ") =>", id);
		return id;
	}

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

	require(token){
		const module = this.get(token);
		if (!module)
			console.error("module not preloaded");
		return module.exports;
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
			this.emit("requested");
		} else {
			throw "trying to re-request?"
		}
	}

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

		this.emit("defined");
	}

	id_from_src(){
		if (!this.id){
			const a = document.createElement("a");
			a.href = document.currentScript.src;

			this.set({
				id: a.pathname,
				log: true // might need to be adjusted
			})
		}
	}

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

	static get(id){
		if (!this.hasOwnProperty("modules"))
			this.modules = {};
		return this.modules[id]
	}

	static set(id, module){
		if (!this.hasOwnProperty("modules"))
			this.modules = {};
		if (this.modules[id])
			throw "don't redefine a module";
		this.modules[id] = module;
		this.emit("new", module, id);
	}

	static url(original){
		const a = document.createElement("a");
		a.href = original;
		return {
			original: original,
			url: a.href,
			host: a.host,
			hostname: a.hostname,
			pathname: a.pathname,
			path: a.pathname.substr(0, a.pathname.lastIndexOf('/') + 1)
		};
	}
}