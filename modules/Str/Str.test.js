Module("Str/Str.test.js", ["Str", "mixin/events.js"], function(StringObject, events){

	var Value = Base.extend("Value", events, {
		set(value){
			this.value = value;
			this.emit("set", value);
		},
		instantiate(value){
			this.set(value);
		}
	});

	const fixture1 = function(a, r, g, s){
		return a+r+g+s;
	}; // extract reusable pieces...

	StringObject.test = function(StringObject){
		Test.controls();

		const Str = StringObject.Str;

		Test("Value", function(){

			var v = Value(10);
			v.on("set", log);
			v.set(5);

		});

		Test("single", function(){
			var s = StringObject().append("single");
		});




		Test("one", function(){
			var str = Str("hello world");
			str.set("new value", "another");
			str.append("more");
			str.set("reset")
		});

		Test("set object", function(){
			this.view.content
				.style("padding", "1em")
				.style("width", "70%")

			str = Str({
				one: "one!",
				two: "two!!"
			})

			str.name = "str";
			str.update(); 
		});




		Test("changes", function(){
			var str = Str();

			str.append(Str("one"), Str("two"));
		});
	};
	
});