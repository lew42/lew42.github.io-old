// this is one.js?
// this is two.js.?
console.timeEnd("docReady");
console.time("document.ready");
define("docReady", function(){
	
	var ready = function(){
		define("document.ready", function(){
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
define("Base", ["is", "server"], function(is, server){
	// for convenience
	window.is = is;
	window.log = define.log;
	window.logger = define.logger;
	window.server = server;

	return define.Base;
});
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

define("mixin", ["mixin/events.js"], function(events){
	return {
		events: events
	};
});
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
define("simple",

[ "is", "mixin", "Base2", "View", "Test", "server", "docReady"],

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