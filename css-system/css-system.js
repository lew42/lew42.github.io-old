Module(["font-awesome.js"], function(){

	var Stylesheet = Base2.extend({
		instantiate: function(){
			this.str = "";
		},
		select: function(selector, strs){
			this.str += selector + " { ";
			for (var i = 0; i < strs.length; i++){
				this.str += strs[i] + " ";
			}
			this.str += "} ";
			return this;
		},
		inject: function(){
			this.el = document.createElement("style");
			this.el.innerText = this.str;
			document.head.appendChild(this.el);
		}
	});

	var styles = Stylesheet();

	styles
		.select(".item", [""])
		.select(".item1", [
			"background: #fff;",
			"padding: 1em;"
		]).select(".item2", ["color: blue;"])
	.inject();


	/// PAGE
	var page = View(function(){
		this.addClass("page-css-system");

		var Item = View.extend({
			classes: "item"
		});

		var item = Item("item");

		var item1 = Item("item1").addClass("item1");

		var item2 = Item("item2").addClass("item2");


	});

	document.addEventListener("DOMContentLoaded", function(){
		console.log("append");
		document.body.appendChild(page.el);
	});
		document.body.appendChild(page.el);
});