define(["indexed/", "test/", "View/"], function(Indexed, Test, View){

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

})