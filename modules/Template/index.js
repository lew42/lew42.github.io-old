Module(["Template", "Template/Template.test.js"], function(Template){
	var testPage = View(function(){
		View({tag: "h1"}, "Template Tests");
		Template.test(Template);
	});

	document.body.appendChild(testPage.el);
});