define("font-awesome.js", function(){
	
	var fontAwesome = View({tag: "link"})
		.attr("rel", "stylesheet")
		.attr("href", "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");
	
	document.head.appendChild(fontAwesome.el);

	return fontAwesome;
})