define(["Grid"], function(Grid){

	Grid.test = function(Grid){
		Test.controls();
		Test(".grid", function(){
			Grid("raw");
		});
		Test(".grid.two", function(){
			Grid(function(){
				p().filler("1-3s");
				p().filler("1-3s");
			});
		});

		Test("left/right", function(){
			// var s = Section();
			// s.left.filler("1-3s");
			// s.right.filler("1-3s");

			Grid().addClass("two").make(5);
		});

	};
});