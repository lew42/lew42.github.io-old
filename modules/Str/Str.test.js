Module("Str/Str.test.js", ["Str"], function(Str){

	const fixture1 = function(a, r, g, s){
		return a+r+g+s;
	}; // extract reusable pieces...

	Str.test = function(Str){
		Test.controls();

		Test("one", function(){
			var str = Str("hello world");
			str.set("new value", "another");
			str.append("more");
			str.set("reset")
		});

		Test("changes", function(){
			var str = Str();

			str.append(Str("one"), Str("two"));
		});
	};
	
});