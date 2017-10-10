define(["Indexed/", "test/", "View/", "log", "is"], function(Indexed, Test, View, log, is){


Indexed.test = function(Indexed){

	var assert = Test.assert;

	Test.controls();

	Test("indexed 1", function(){
		log("the value of thing", Indexed);
		var idx = window.idx = new Indexed({
			name: "idx1"
		});
		idx.load();
		idx.render();
		console.log(idx);
		idx.add({
			name: "Joe"
		});

	});

	Test("indexed 2", function(){
		log("the value of thing", Indexed);
		var idx = window.idx2 = new Indexed({
			name: "idx2"
		});
		idx.load();
		idx.render();
		console.log(idx);
		idx.add({
			name: "Joe"
		});

	});
	
};



})