define("View/View.tests.js", ["View/"], function(View){

var viewTests = View(function(){

View().append({
	one: "one",
	two: ["t", "w", "o"],
	three: View({tag: "span"}, "three"),
	four: View("four").addClass("four-two"),
	five: function(){
		View("fi");
		View("ve");
	},
	six: {
		a: "a",
		b: View({tag: "button"}, "b")
	}
});

});

document.body.appendChild(viewTests.el);
console.log("View.tests.js");

});