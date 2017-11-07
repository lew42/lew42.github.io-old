Module(["Module", "Module/Module.test.js"], function(Module){
	var testPage = View(function(){
		View({tag: "h1"}, "Module Tests");
		Module.test(Module);
	});

	document.body.appendChild(testPage.el);
});