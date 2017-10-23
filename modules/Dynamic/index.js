define(["Dynamic", "Dynamic/Dynamic.test.js"], function(Dynamic){
	var testPage = View(function(){
		View({tag: "h1"}, "Dynamic Tests");
		Dynamic.test(Dynamic);
	});

	document.body.appendChild(testPage.el);
});