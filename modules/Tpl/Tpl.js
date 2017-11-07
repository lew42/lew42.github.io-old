Module(

// id
"Tpl/",

// dependencies
[	
	// imports
	"is", 
	"View/", 
	"Stylesheet/",

	// requires 
	"font-awesome"
],

function(is, View, Stylesheet){

	var styles = Stylesheet();

	styles.select("selector", "css")
	styles.inject();

	var Tpl = View.extend({});

	return Tpl;

});