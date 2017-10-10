define(

// id
"Icon/",

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

	var Icon = View.extend({});

	return Icon;

});