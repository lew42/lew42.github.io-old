define(["Section"], function(Section){

	Section.test = function(Section){
		Test.controls();
		Test(".grid", function(){
			Section("raw");
		});
		Test(".grid.two", function(){
			Section("raw");
		});

	};
});