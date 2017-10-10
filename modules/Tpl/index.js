define(

// id
"/modules/Tpl/index.js",

// dependencies
[	
	// imports
	"is", 
	"View/",
	"Tpl/",
	"Tpl/Tpl.tests.js",

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