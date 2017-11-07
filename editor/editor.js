Module(function(){
	var Editor = View.extend({
		render: function(){
			this.attr("contenteditable", true);
		}
	});
});