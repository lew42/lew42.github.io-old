Module(["Grid", "Grid/Grid.test.js"], function(Grid){
	var testPage = View(function(){
		View({tag: "h1"}, "Grid Tests");
		Grid.test(Grid);
	});

	document.body.appendChild(testPage.el);
});