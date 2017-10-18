define("Request", function(){


	var Request = Base2.extend({
		instantiate: function(){
			this.assign.apply(this, arguments);
			this.xhr = new XMLHttpRequest();
			this.xhr.addEventListener("load", this.load.bind(this));
			this.xhr.open("GET", this.url);
			this.xhr.send();
		}
	});

	return Request;
});