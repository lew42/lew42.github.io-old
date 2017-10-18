define(["Section", "Section/Section.test.js"], function(Section){
	var testPage = View(function(){
		View({tag: "h1"}, "Section Tests");
		Section.test(Section);
	});

	document.body.appendChild(testPage.el);
});