define(

// id
"/page/index.js",

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

	var page = View(function(){

	}).addClass("page");

	document.body.appendChild(page.el);

});