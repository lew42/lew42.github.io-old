define("Section", ["Icon"], function(Icon){
	var Section = View.extend({
		render: function(){
			// this.on("mouseenter", function(){
			// 	this.addClass("hover");
			// 	this.addMenu();
			// });

			// this.on("mouseleave", function(){
			// 	this.removeClass("hover");
			// 	this.removeMenu();
			// });

			this.addMenu();
			Icon("beer");
		},
		addMenu: function(){
			if (!this.menu){
				this.append({
					menu: this.render_menu
				});
			} else {
				this.append(this.menu);
			}
		},
		removeMenu: function(){
			if (this.menu){
				this.menu.remove();
			}
		},
		render_menu: function(){
			Icon("menu");
		}
	});
	return Section;
});