Module(

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

	var page = View(function(){



	}).addClass("page");

	document.body.appendChild(page.el);

});