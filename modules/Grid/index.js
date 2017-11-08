m = Module(["Grid", "Grid/Grid.test.js"], {debug: true}, function(Grid){
	var testPage = View(function(){
		View({tag: "h1"}, "Grid Tests");
		Grid.test(Grid);
	});

	console.log("yea");

	document.body.appendChild(testPage.el);
});

console.log(m);