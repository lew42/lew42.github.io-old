define("Template", ["Stylesheet"], function(Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Template/Template.css");

	var Template = View.extend({
		append_pojo: function(pojo){
			var value, view;

			if (pojo.path){
				if (pojo.target){
					this.path(pojo.target).append(this.path(pojo.path));
				} else {
					this.append(this.path(pojo.path))
				}
			}

			for (var prop in pojo){
				value = pojo[prop];
				if (value && value.el){
					view = value;
				} else if (!value){
					// false, undefined, or otherwise falsy
					continue;
				} else {
					view = View().append(value);
				}
				this[prop] = view
					.addClass(prop)
					.appendTo(this);
			}
		}
	});
});