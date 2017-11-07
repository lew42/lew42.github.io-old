Module(["Icon"], function(Icon){

	Icon.test = function(Icon){
		Test.controls();

		Test("plane", function(){
			Icon("plane");
			Icon("plane").size("lg");
		});

		Test("beer", function(){
			Icon("beer");
		});

	};
});