Module(
	
// dependencies
[	
	// imports
	"Stylesheet",

	// requires 
	"font-awesome.js"
],

function(Stylesheet){

	var styles = Stylesheet();
	// styles.request("page.css");
	// styles.select("selector", ["css"]);
	// styles.inject();
	var value = 3;

	var MyClass = Base2.extend({
		instantiate: function(){
			this.assign.apply(this, arguments);
		},
		myMethod: function(){
			console.log(value, this);
			return this;
		},
		newFn: new Function("console.log(this); return this;"),
		evalFn: eval("(function(){\
			console.log(value, this);\
			return this;\
		})"),
	});

	MyClass({ id: 123 })
		.myMethod()
		.newFn()
		.evalFn()

	var page = View(function(){



	}).addClass("page");

	document.body.appendChild(page.el);

});