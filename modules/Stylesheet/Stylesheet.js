define("Stylesheet", function(){

	var Stylesheet = Base2.extend({
		instantiate: function(){
			this.str = "";

			this.assign.apply(this, arguments);
		},
		select: function(selector, strs){
			this.str += selector + " { ";
			for (var i = 0; i < strs.length; i++){
				this.str += strs[i] + "; ";
			}
			this.str += "} ";
			return this;
		},
		inject: function(){
			this.el = document.createElement("style");
			this.el.innerText = this.str;
			document.head.appendChild(this.el);
		},
		request: function(url){
			this.link = document.createElement("link");
			this.link.setAttribute("rel", "stylesheet");
			this.link.setAttribute("href", url);

			document.head.appendChild(this.link);
		}
	});

	return Stylesheet;

});