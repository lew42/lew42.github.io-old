define(["Icon", "Icon/Icon.test.js"], function(Icon){
	var testPage = View(function(){
		View({tag: "h1"}, "Icon Tests");
		Icon.test(Icon);
	});

	document.body.appendChild(testPage.el);
});