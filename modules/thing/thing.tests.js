define(["thing/", "test/", "View/"], function(Thing, Test, View){

var assert = Test.assert;

Test.controls();

Test("thing 1", function(){
	log("the value of thing", Thing);
	assert(1);
	assert(0);
});

})