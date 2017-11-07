Module(["Grid"], function(Grid){

	Grid.test = function(Grid){
		Test.controls();

		Grid = Grid.extend({
			controls: function(){
				var grid = this;
				this._controls = View(function(){
					this.addClass("test-class-toggles");
					grid.controls_numberClasses();
				});
				return this;
			},
			controls_numberClasses: function(){
				var grid = this;
				var numberClasses = ["one", "two", "three"];
				var numberButtons = {};
				View(function(){
					this.addClass("test-class-toggle-group");
					numberClasses.forEach(function(n){
						numberButtons[n] = View(n, {n: n}).click(function(){
							grid.removeClass(numberClasses);
							for (var i in numberButtons){
								numberButtons[i].removeClass("active");
							}
							grid.addClass(n);
							this.addClass("active");
						}).addClass("test-class-toggle");

						if (grid.hasClass(n)){
							numberButtons[n].addClass("active");
						}
					});
				});
			}
		});

		Test(".two.spaced.zg, 4 items", function(){
			Grid().addClass("two spaced zg").controls().make(4);
		});
		Test(".two.spaced.zg, 5 items", function(){
			Grid().addClass("two spaced zg").controls().make(5);
		});


		Test(".two.spaced, 4 items", function(){
			Grid().addClass("two spaced").controls().make(4);
		});
		Test(".two.spaced, 5 items", function(){
			Grid().addClass("two spaced").controls().make(5);
		});


		Test(".grid.two, with 4 items", function(){
			Grid().addClass("two").controls().make(4);
		});

		Test(".grid.two, with 5 items", function(){
			Grid().addClass("two").controls().make(5);
		});


	};
});