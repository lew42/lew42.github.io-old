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




		Test("one", function(){
			var str = Str("hello world");
			str.set("new value", "another");
			str.append("more");
			str.set("reset")
		});

		Test("set object", () => {
			var str = Str({
				one: "one",
				two: "two"
			})
		});




		Test("changes", function(){
			var str = Str();

			str.append(Str("one"), Str("two"));
		});
	};
	
});