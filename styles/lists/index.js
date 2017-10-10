define("/styles/lists/index.js", ["is", "View/", "Stylesheet/", "font-awesome"], function(is, View, Stylesheet){

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

		// this is probably easier... why predefine a bunch of nonsense?
		item1.label = "whatever";
		item1.update();

		item1.set_label("new label..");

		item1.icon.set("plane");

		// A very basic .set() could be helpful
		// its like .constructs(), only... reusable
		// we could do top-down .set({}), which then calls set_*, which then updates?
		// but, this is still a lot of work to write all those update functions
		// you could just put an .update() in .set()...
			// all .set() calls will auto-update...
			// not very efficient, but much simpler than the alternative


	}).addClass("lists-page");

	document.body.appendChild(page.el);

});