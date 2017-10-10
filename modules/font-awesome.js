define("font-awesome", ["View/"], function(View){

	var fontAwesome = View({tag: "link"})
		.attr("rel", "stylesheet")
		.attr("href", "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");
	
	document.head.appendChild(fontAwesome.el);

	return fontAwesome;
})