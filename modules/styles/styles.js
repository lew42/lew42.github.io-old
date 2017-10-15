define("styles", function(){
	var main = View({tag: "link"})
		.attr("rel", "stylesheet")
		.attr("href", "/css/main.css");

	document.head.appendChild(main.el);
});