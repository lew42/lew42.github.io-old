Module(

// id
"Icon",

// dependencies
[	
	// imports
	"Stylesheet",

	// requires 
	"font-awesome.js"
],

function(Stylesheet){

	var styles = Stylesheet();
	styles.request("/modules/Icon/Icon.css");
	// styles.select("selector", ["css"])
	// styles.inject();

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

	return Icon;

});