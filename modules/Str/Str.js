Module("Str", ["mixin/events.js", "Stylesheet"], function(events, Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Str/Str.css");

	var Str = Base.extend("Str", events, {
		log: true,
		instantiate: function(...args){
			this.preset();
			this.set(...args);
			this.setup();
			this.initialize();
		},
		set: function(){
			this.reset();
			Base.prototype.set.apply(this, arguments);
			return this;
		},
		preset: function(){
			this.strs = []; // .set can .append
			this.views = []; // .append -> .update -> .views
			this.change = this.change.bind(this); // append substr
		},
		set_value: function(value){
			this.append(value);
		},
		reset: function(){
			for (const str in this.strs){
				if (str && str.off)
					str.off("change", this.change);
			}
			this.strs = [];
		},
		setup: function(){
			this.events = {};
		},
		initialize: function(){
			this.render();
			this.init();
		},
		init: function(){},
		append: function(str){
			this.strs.push(str);

			// batch these updates?
			// values could update in realtime
			// views should not
			this.change();

			if (str && str.on){
				str.on("change", this.change);
			}
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
				view.set(this.toString());
			}
		},
		build(){
			var value = "";
			for (const str of this.strs){
				value += str ? str.toString() : "";
			}

			return value;
		},
		render: function(){
			var view = View(this.toString());
			this.views.push(view);
			return view;
		},
		toString: function(){
			return this.value;
		}
	});

	return Str;
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