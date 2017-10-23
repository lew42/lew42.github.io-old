define(["Async", "Async/Async.test.js"], function(Async){
	var testPage = View(function(){
		View({tag: "h1"}, "Async Tests");
		Async.test(Async);
	});

	document.body.appendChild(testPage.el);
});