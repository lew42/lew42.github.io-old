define(
	
// dependencies
[	
	// imports
	"Stylesheet",

	// requires 
	"font-awesome.js"
],

function(Stylesheet){

	var styles = Stylesheet();
	// styles.request("page.css");
	// styles.select("selector", ["css"]);
	// styles.inject();

	var Container = View.extend({
		render: function(){
			this.click(function(){
				if (this.selected){
					this.deselect();
				} else {
					window.target.deselect();
					this.select();
				}
			});
		},
		deselect: function(){
			if (this.selected){
				this.removeClass("selected");
				this.selected = false;
				window.target = page;
			}
		},
		select: function(){
			this.addClass("selected");
			window.target = this;
			this.selected = true;
		}
	});

	var page = View({
		deselect: function(){}
	}, function(){
		
		Container("one");
		Container("two");


	}).addClass("page");

	var lib = View(function(){
		h3("lib");
		View("name").click(function(){
			target.append("hi");
		});
	});

	window.target = page;
	window.lib = lib;

	document.body.appendChild(lib.el);
	document.body.appendChild(page.el);

});