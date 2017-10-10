define("View/", ["Base2/", "is"], function(Base2, is){

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