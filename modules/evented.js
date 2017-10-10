define("evented", function(){

return {
	// must init events!
	// init: function(){
		// this.events = {};
	// },
	on: function(event, cb){
		var cbs = this.events[event] = this.events[event] || [];
		cbs.push(cb);
		console.log(this.events);
		return this;
	},
	emit: function(event){
		var cbs = this.events[event] || [];
		for (var i = 0; i < cbs.length; i++){
			cbs[i].apply(this, [].slice.call(arguments, 1));
		}
		return this;
	}
};

});
