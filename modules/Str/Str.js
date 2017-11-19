Module("Str", ["mixin/events.js", "Stylesheet"], function(events, Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Str/Str.css");

	// Basic and Base?
	// where Basic is more basic...
	var Value = Base.extend("Value", events, {
		set(value){
			this.value = value;
			this.emit("set", value);
		},
		instantiate(value){
			this.set(value);
		}
	});

	var StringValueObject = Base.extend("StringValueObject", events, {
		instantiate(...args){
			// this.
		}
	});

	var StringObject = Base.extend("StringObject", events, {
		log: true,
		auto_render: true,
		instantiate(...constructs){
			this.preset();
			this.set(...constructs);
			this.initialize();
		},
		/*TODO: define this on Base, and break it down into set__subs?
		set__subs conflict with set_* pattern... 

		set__sub() would be called if you have a prop that's named _sub ... 
		set$sub might be better, a little strange though... */
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
		// called by Base.prototype.set
		set_(value){
			this.append(value);
		},
		// these things need to happen before .instantiate's .set(...constructs)
		preset(){
			this.children = []; // .set can .append
			this.views = []; // .append -> .update -> .views
			this.events = {}; // is this needed preset? or postset?
			this.change = this.change.bind(this); // append substr
		},
		empty(){
			// clean up handlers before nuking this.children
			for (const child in this.children){
				if (child && child.off)
					child.off("change", this.change);
				if (child && child.name && this[child.name] === child)
					delete this[child.name]
			}
			this.children = [];
		},
		initialize: function(){
			this.auto_render && this.render();
			this.init();
		},
		init: function(){},
		append: function(...args){
			if (!this.children.length && this.value){
				this.append_string(this.value);
			}

			for (const arg of args){
				if (is.str(arg)){
					this.append_string(arg);
				} else if (is.pojo(arg)){
					this.append_pojo(arg);
				} else if (arg instanceof StringObject){
					this.append_stringObject(arg);
				}
			}

			// should each append_ sub call do a .change()?
			// would need to delay/batch them?
			// or, we *should* emit change even if we have additional appends?
			this.change();
			return this;
		},
		// fn_sub() vs fn__partial()
		// __ indicates, not meant to be called in isolation
		// here, we don't want to issue "change" events every time?
		// maybe we could batch/queue them (buffer), and dispatch the update async?
		// it's really only the DOM we want to delay.. the rest can be sync

		// append "str" literal
		append_string(string){
			var stringObject = StringObject({
				value: string,
				auto_render: false
			});
			this.append_stringObject(stringObject);
			return this;
		},
		append_stringObject(stringObject){
			if (!(stringObject instanceof StringObject))
				debugger

			this.children.push(stringObject);
			stringObject.on("change", this.change);
			return this;
		},
		append_pojo(pojo){
			for (const prop in pojo){
				this.append_prop(prop, pojo[prop]);
			}
			return this;
		},
		append_prop(prop, value){
			var stringObject;
			if (value instanceof StringObject){
				stringObject = value;
			} else if (!value){
				console.warn("how to handle these?");
			} else {
				stringObject = StringObject({ auto_render: false }).append(value);
			}
			this[prop] = stringObject;
			this.append_stringObject(stringObject);
			return this;
		},
		change: function(){
			var value = this.build();

			// this.log("old:", this.value, "new:", value);
			if (this.value !== value){
				// cache it
				this.value = value;

				this.update();

				// notify dependents
				this.emit("change", this.value);
			} else {
				console.warn("unnecessary build()");
			}
		},
		update(){
			// redraw all views (janky)
			for (const view of this.views){
				view.update();
			}
		},
		build(){
			var value = "";
			for (const child of this.children){
				if (child && child.toString)
					value += child.toString()
				else
					console.warn("whoops");
			}

			return value;
		},
		render: function(){
			var view = View({
				classes: "StringObject",
				strObj: this,
				render: function(){
					this.preview = View(() => {
						this.name = View(this.strObj.name);
						this.value = View();
					});
					this.children = View();
				},
				update: function(){
					this.value.set(this.strObj.value);
					this.children.remove();
					this.children.empty();
					for (const child of this.strObj.children){
						if (child && child.render)
							this.children.append(child.render())
					} 
				}
			}).addClass("StringObject");
			this.views.push(view);
			return view;
		},
		toString: function(){
			return this.value;
		}
	});

	var Str = StringObject.Str = StringObject.extend("Str", {
		// basically, pojo's auto-append
		set(...args){
			this.empty();
			this.append(...args);
			return this;
		},
	});

	return StringObject; // convert to CommonJS module.exports ...
});

/*

Str("from literal")
--> set --> append


// Views and Str from {} is quite handy...
// I suppose .append() is slightly better, so you can add methods or w/e
Str({
	methods(){}
});



*/