define("index.js", [   "styles", "Grid"], function(){
	var page = View(function(){
		View("document.documentElement.clientWidth ", document.documentElement.clientWidth);
		View("window.innerWidth ", window.innerWidth);
		View("window.screen.width ", window.screen.width);
		View("window.screen.availWidth ", window.screen.availWidth );
	});

	document.addEventListener("DOMContentLoaded", function(){
		document.body.appendChild(page.el);
	});
	document.body.appendChild(page.el);
});