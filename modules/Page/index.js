Object.defineProperty(window, "view", {
	set: function(value){
		debugger;
	}
})
define(["Page", "Page/Page.test.js"], function(Page){
	var testPage = View(function(){
		View({tag: "h1"}, "Page Tests");
		Page.test(Page);
	});

	document.body.appendChild(testPage.el);
});