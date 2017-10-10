// define.debug = define.debug.on;
define(["indexed/", "indexed/indexed.tests", "View/"], function(Indexed, IndexedTests, View){

var TestPage = View(function(){
	View({tag: "h1"}, "Indexed").click(function(){
		
	});
	Indexed.test(Indexed);
});

document.body.appendChild(TestPage.el);

})