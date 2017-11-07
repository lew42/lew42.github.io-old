Module(["Coll", "Coll/Coll.test.js"], function(Coll){
	var testPage = View(function(){
		View({tag: "h1"}, "Coll Tests");
		Coll.test(Coll);
	});

	document.body.appendChild(testPage.el);
});