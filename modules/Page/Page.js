define("Page", ["Stylesheet"], function(Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Page/Page.css");

	var Page = Base2.extend({
		instantiate: function(){
			this.constructs.apply(this, arguments);
			this.initialize();
		},
		constructs_fn: "render", // could be changed to "content"
		constructs: function(){
			var arg;
			for (var i = 0; i < arguments.length; i++){
				arg = arguments[i];
				if (is.str(arg)){
					this.id = arg;
				} else if (is.fn(arg)){
					this[this.constructs_fn] = arg;
				} else if (is.arr(arg)){
					this.deps = arg;
				} else if (is.obj(arg)){
					this.assign(arg);
				}
			}
		},
		initialize: function(){
			if (this.deps){
				this.deps.push("document.ready");
			}
			define(this.id, this.deps, this.factory.bind(this));
		},
		factory: function(){
			var fn = this[this.constructs_fn];
			// when the module/file is loaded
					// 1. we instantiage a new Page()
					// 2. .initialize() will define the module for you
					// 3. define will call this .factory(with, the, deps)

			// 4. we bind the deps to the constructs_fn: Page(fn(deps, come, here){})
			this[this.constructs_fn] = fn.bind.apply(fn, [this].concat([].slice.call(arguments)));
			
			// 5. we export the page instance, which is cached by define
			return this;

			// 6. we require "/page/", get the page instance, and call .render();
			// 7. if we want to wrap the page, so that the Page(fn(){}) is really
				// the page's contents, we can do that...
		},
		render: function(){}
	});

	return Page;
});