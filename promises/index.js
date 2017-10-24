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
						classes: "grid promise",
						name: p.name,
						p: p,
						render: function(){

							this.p.view = this;

							this.p.then(function(value){
								this.resolved(value)
							}.bind(this), function(value){
								this.rejected(value);
							}.bind(this));

							this.append(this.p.name, View("resolve").addClass("btn").click(function(){
								// lib.append(function(){
									this.p.resolve(this.p.value || this.p.name);
								// }.bind(this));
							}.bind(this)), View("reject").addClass("btn").click(function(){
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

			var auto_promise = function(name, value){
				var rs, rj;
				var p = new Promise(function(res, rej){
					rs = res;
					rj = rej;
				});

				p.resolve = rs;
				p.reject = rj;
				p.name = name;
				p.value = value;

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
				
			});

			Test("sequence", function(){
				var test = this;
				var get = function(value){
					var p = auto_promise("get", value);
					test.view.append(p.view);
					return p;
				};

				var resolved = function(name){
					var p = auto_promise(name);
					p.resolve();
					return p;
				};

				var addHtmlToPage = function(html){
					console.log("adding to page:", html);
				};

				get({
					chapterUrls: [
						"/chapter/one/",
						"/chapter/two/",
						"/chapter/three/"
					]
				}).then(function(story){

				  return story.chapterUrls.reduce(function(sequence, chapterUrl) {
				  	console.log("reducing");
				    // Once the last chapter's promise is done…
				    return sequence.then(function() {
				    	console.log("getting chapterUrl", chapterUrl);
				      // …fetch the next chapter
				      return get(chapterUrl);
				    }).then(function(chapter) {
				      // and add it to the page
				      addHtmlToPage(chapter);
				    });
				  }, resolved("sequence"));
				});
			});

	}).addClass("page");

	document.body.appendChild(page.el);

});