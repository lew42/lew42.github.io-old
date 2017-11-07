Module(["Stylesheet", "Lorem", "Grid"], function(require){
	var Stylesheet = require("Stylesheet");
	Stylesheet().request("content.css");

	var page = View(function(){
		h1("Big Separation Here")
		// .style("margin-bottom", "0.5em");
		View(function(){
			this.addClass("grid two xl-spacing padded")
				.style("margin-bottom", "3em");

			for (var i = 0; i < 5; i++){
				View(
					h3().filler("1s"), 
					p().filler("1-3s")
				).addClass("content item-" + (i+1));;
			}
		});

		View(function(){
		
			this.addClass("padded content");
			this.style("background", "#eee").style("padding", "1em");

			View(function(){
				this.addClass("grid two spaced zg");

				for (var i = 0; i < 5; i++){
					View(
						p().filler("1-3s"), 
						p().filler("1-3s")
					).addClass("padded content paper item-" + (i+1));;
				}
			});
			h1("Big Separation Here").style("margin-top", "2em")
			// .style("margin-bottom", "0.5em");
			View(function(){
				this.addClass("grid two xl-spacing")
					.style("margin-bottom", "3em");

				for (var i = 0; i < 5; i++){
					View(
						h3().filler("1s"), 
						p().filler("1-3s")
					).addClass("content item-" + (i+1));;
				}
			});

			/* Large Content + Small Padding === Normal Padding?  
					nope.

			1.5 x 0.75 !== 1
			1.5 x 0.6666 === 1
			1.3333 x 0.75 === 1

			Either change the default scale (s, m, l)

			Or, create CSS classes to rescale it:
				.large.pad-s { padding: 0.6666em; }

			But, when we start customizing these sizes - we need the entire system to resize itself.
				
				That's where a preprocessor comes in.

				Or, we can create a CSS generator with JavaScript?
			*/
			// View(function(){
			// 	this.addClass("padded content l pad-s").style("background", "white");

			// 	h3("div.content.large.pad-s");
			// 	p("The small padding on a large container should match normal padding?");
			// });


			View(function(){
				this.addClass("padded content").style("background", "white");

				h1().filler("1s");

				p().filler("2-5s").addClass("l");
				p().filler("2-5s");
				p().filler("2-5s");
				View(
					h2("Callout Section"),
					p("This section is just a div.full.padded.content."),
					p().filler("1-3s")
				).addClass("full padded content").style("background", "#ccc");
				p().filler("2-5s");
				p().filler("2-5s");
				View(
					View().addClass("padded content")
						.style("background", "blue")
						.style("width", "50%")
						.filler("1-3s"),
					View().addClass("padded content")
						.style("background", "red")
						.style("width", "50%")
						.filler("1-3s")
				).addClass("overflow").style("display", "flex").style("color", "white");
			});

			// View(function(){
			// 	this.addClass("padded content");

			// 	p().filler("1-3s");
			// 	p().filler("1-3s");
			// 	p().filler("1-3s");
			// });

			// View(function(){
			// 	this.addClass("padded content s");

			// 	p().filler("1-3s");
			// 	p().filler("1-3s");
			// 	p().filler("1-3s");
			// });

			// View(function(){
			// 	this.addClass("padded content l");

			// 	p().filler("1-3s");
			// 	p().filler("1-3s");
			// 	p().filler("1-3s");
			// });

		});
	});

	document.addEventListener("DOMContentLoaded", function(){
		document.body.appendChild(page.el);
	});
	document.body.appendChild(page.el);
});