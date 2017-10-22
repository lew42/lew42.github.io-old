define(

// dependencies
[	
	// imports
	"Stylesheet",

	// requires 
	"font-awesome.js",
	"Grid"
],

function(Stylesheet){

	var styles = Stylesheet();
	styles.request("promises.css");
	// styles.select("selector", ["css"]);
	// styles.inject();

	var page = View(function(){

			var lib = window.lib = View({
				classes: "lib",
				add: function(p){

					this[p.name] = View({
						classes: "grid",
						name: p.name,
						p: p,
						render: function(){

							this.p.then(function(value){
								this.resolved(value)
							}.bind(this), function(value){
								this.rejected(value);
							}.bind(this));

							this.append(this.p.name, View("resolve").click(function(){
								this.p.resolve();
							}.bind(this)), View("reject").click(function(){
								this.p.reject();
							}.bind(this)));
						},
						resolved: function(){
							this.addClass("resolved");
						},
						rejected: function(){
							this.addClass("rejected");
						}
					});

					// this.append(this[p.name]);

				}
			});

			var auto_promise = function(name){
				var rs, rj;
				var p = new Promise(function(res, rej){
					rs = res;
					rj = rej;
				});

				p.resolve = rs;
				p.reject = rj;
				p.name = name;

				lib.add(p);
				return p;
			};

			// auto_promise("one").then(function(){
			// 	throw "problem";
			// 	return auto_promise("pass");
			// }, function(){
			// 	return auto_promise("fail")
			// }).catch(function(){
			// 	return auto_promise("catch");
			// });

			Test("one", function(){
				auto_promise("one").then(function(){
					return Promise.reject();
				});
				
			})

	}).addClass("page");

	document.body.appendChild(page.el);

});