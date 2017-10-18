define("Stylesheet", function(){

	var Stylesheet = Base2.extend({
		instantiate: function(){
			this.str = "";
		},
		select: function(selector, strs){
			this.str += selector + " { ";
			for (var i = 0; i < strs.length; i++){
				this.str += strs[i] + " ";
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
			this.el = document.createElement("link");
			this.el.setAttribute("rel", "stylesheet");
			this.el.setAttribute("href", url);

			document.head.appendChild(this.el);
		}
	});

	return Stylesheet;

});