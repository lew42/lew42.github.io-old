Module("Grid", ["Stylesheet", "Icon", "Lorem"], function(Stylesheet, Icon){


	// .grid-spacing(@n, @y, @x){
	// 		@width: 100/@n - 2*@x;
	// 		padding: unit(@y, %) unit(@x, %);
	// 		> * {
	// 			margin: unit(@y, %) unit(@x, %);
	// 			width: unit(@width, %);
	// 		}
	// 		&.break > * {
	// 			width: 100%;
	// 		}
	// 		&.zg {
	// 			padding: 0;
	// 			> * {
	// 				width: unit(2*@x/@n + @width, %);
	// 			}
	// 			&.break > * {
	// 				width: 100%;
	// 				margin-left: 0;
	// 				margin-right: 0;
	// 			}
	// 		}
	// }


	// .grid-two-gutter-fix() {
	// 	> * {
	// 		&:nth-child(2n+1){
	// 			margin-left: 0;
	// 		}
	// 		&:nth-child(2n){
	// 			margin-right: 0;
	// 		}
	// 		&:nth-child(1) {
	// 			margin-top: 0;
	// 		}
	// 		&:nth-last-child(1) {
	// 			margin-bottom: 0;
	// 		}
	// 	}
	// 	&:not(.break) > * {
	// 		/* when we .break, these mess up the spacing */
	// 		&:nth-child(1), &:nth-child(2) {
	// 			margin-top: 0;
	// 		}
	// 		&:nth-last-child(1), &:nth-last-child(2) {
	// 			margin-bottom: 0;
	// 		}

	// 	}
	// }
	var perc = function(n){
		return n + "%";
	};

	var styles = Stylesheet({
		spaced_old: function(selector, n, y, x){
			var width = (100/n) - 2*x;
			this.select(selector, [
				"padding: " + perc(y) + " " + perc(x)
			]);
			this.select(selector + " > *", [
				"margin: " + perc(y) + " " + perc(x),
				"width: " + perc(width)
			]);
			this.select(selector + ".zg", [
				"padding: 0"
			]);
			this.select(selector + ".zg > *", [
				"width: " + perc(2*x/n + width)
			]);
		},
		spaced: function(selector, n, y, x){
			var width = (100/n) - 2*x;
			this.select(selector + " > *", [
				"margin: " + perc(y) + " " + perc(x),
				"width: " + perc(2*x/n + width)
			]);
			if (n === 2){
				this.twoGutterFix(selector);
			}
		},
		twoGutterFix: function(selector){
			this.select(selector + " > *:nth-child(2n+1)", [
				"margin-left: 0"
			]);
			this.select(selector + " > *:nth-child(2n)", [
				"margin-right: 0"
			]);
			this.select(selector + " > *:nth-child(1), " +
						selector + " > *:nth-child(2)", [
				"margin-top: 0"
			]);
			this.select(selector + " > *:nth-last-child(1), " +
				selector + " > *:nth-last-child(2):not(:nth-child(2n))", [
				"margin-bottom: 0"
			]);
		}
	});
	
	styles.request("/modules/Grid/Grid.css");

	styles.spaced(".grid.two.spaced", 2, 1, 1.25);
	styles.spaced(".grid.two.large-spacing", 2, 2, 2.5);
	styles.spaced(".grid.two.xl-spacing", 2, 4, 5);
	styles.spaced(".grid.three.spaced", 3, 1, 1.25);
	
	styles.inject();

	var Grid = section.extend({
		classes: "grid",
		make: function(n){
			for (var i = 0; i < n; i++){
				this.append(View().filler("1-3s"));
			}
			return this;
		}
	});
	return Grid;
});