define("/styles/lists/index.js", ["is", "View/", "Stylesheet/"], function(is, View, Stylesheet){

	var fontAwesome = View({tag: "link"}).attr("rel", "stylesheet").attr("href", "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");
	document.head.appendChild(fontAwesome.el);

	var styles = Stylesheet();

	styles.select("body", "font-family: monospace; letter-spacing: -0.3px")

	styles.select(".item-1", "")
	styles.select(".item-1 > .header", "display: flex;")
	styles.inject();

	var page = View(function(){

		var Icon = View.extend({
			tag: "i",
			classes: "fa fa-fw",
			icon: "circle",
			constructs: function(){
				var arg;
				for (var i = 0; i < arguments.length; i++){
					arg = arguments[i];
					if (is.pojo(arg)){
						this.assign(arg);
					} else {
						if (!this.el) this.render_el();
						if (is.str(arg))
							this.set(arg)
						else
							this.append(arg);
					}
				}
			},
			render: function(){
				this.set(this.icon);
			},
			set: function(icon){
				this.removeClass("fa-" + this.icon);
				this.addClass("fa-" + icon);
				this.icon = icon;
				return this;
			},
			//  "lg", "2x", "3x", "4x", or "5x"
			size: function(size){
				["lg", "2x", "3x", "4x", "5x"].forEach((s) => this.removeClass("fa-"+s));
				this.addClass("fa-"+size);
				return this;
			}
		})

		var Item1 = View.extend({
			classes: "item-1",
			render: function(){
				this.append({
					// header: View(() => {
					// 	Icon("beer"); View(this.label); Icon("caret-down");
					// })
					// header: [{
					// 	icon: Icon("beer"),
					// 	label: View(),
					// 	btn: Icon("caret-down")
					// }, (header) => {
					// 	// access header here
					// }],
					// or just
					header: {
						icon: Icon("beer"),
						label: "",
						btn: Icon("caret-down")
					},
					content: {}
				});

				// promote important views to the top
				this.icon = this.header.icon;

				this.update();
			},
			update: function(){
				this.header.label.set(this.label);
			}
		});


		var item1 = Item1({
			label: "my first item",
			set_label: function(label){
				this.label = label;
				this.update();
			}
		});

		item1.set_label("new label..");

		item1.icon.set("plane");

		// A very basic .set() could be helpful
		// its like .constructs(), only... reusable
		// we could do top-down .set({}), which then calls set_*, which then updates?
		// but, this is still a lot of work to write all those update functions
		// you could just put an .update() in .set()...
			// all .set() calls will auto-update...
			// not very efficient, but much simpler than the alternative


/*

How about, never store properties on the views?

I suppose, for something simple like an Icon, we don't really need an Icon and IconView.

But, for most other things, if you have a Thing, and a ThingView, you can
* render multiples
* mimic property names (thing.label ---> thingView.label)
* automate updating?

If thing.set({prop}) looks for thing.set_prop,
and thing.set_prop is auto-configured to views.each((view) => view.update_prop(newValue))

Or, we create .props{}, and .set() looks at .props, and if it exists, does an auto-update?
And if the view can automatically update dom based on propnames...

1.  we create the Thing, with certain propNames
2.  those propNames are registered on thing.props{}
3.  thing.set({}) acts like assign, unless it finds thing.props{propName} match
4.  those registered props identify a thingView[propName]
		this means, we need thing.icon to point to thingView.icon, even if its nested

One issue here, is that you can't easily extend the set_propName behavior?
If you want it automated, and you want to customize it... we have a little problem


Just stick to a simple solution for now:  ignore maximum performance for ease of use.
item.assign({..}).update();
update -> views.each.update() --> updates all properties every time...

*/


	}).addClass("lists-page");

	document.body.appendChild(page.el);

});