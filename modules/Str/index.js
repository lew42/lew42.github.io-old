Module(["Str", "Str/Str.test.js"], function(require){
	var Str = require("Str");

	var testPage = View(function(){
		View({tag: "h1"}, "Module Tests");
		Str.test(Str);
	});

	document.body.appendChild(testPage.el);
});