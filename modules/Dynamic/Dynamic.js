Module("Dynamic", ["Stylesheet"], function(Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Dynamic/Dynamic.css");

	var Dynamic = Base2.extend(mixin.events, {
		instantiate: function(){
			this.events = {};
			this.assign.apply(this, arguments);
		},
		json: function(pretty){
			return pretty ? JSON.stringify(this.data, null, 3) : JSON.stringify(this.data);
		},
		save: function(){
			if (!this.name)
				console.error("must use a name");
			// save at root with this.name?

			this.log("saving", this.json(true));
			// can't stringify items w/ references...
			window.localStorage.setItem(this.name, this.json());
		},
		load: function(){
			this.log.group("load", this.name);
			// load from root with this.name?
			this.data = JSON.parse(window.localStorage.getItem(this.name));
			this.log("load data", this.data);
			if (!this.data){
				this.log("not found");
				this.data = { length: 0 };
				this.save();
			} else {
				this.load_data();
			}

			this.on("change", function(){
				console.log("on change");
				this.save();
			}.bind(this));

			this.log.end();
		},
		load_data: function(){
			if (this.data.initial_instructions){
				this.run(this.data.initial_instructions);
			}
		},
		run: function(){
			
		},
		path: function(path){
			var parts, value = this;
			if (is.str(path)){
				parts = path.split(".");
			} else if (is.arr(path)) {
				parts = path;
			}

			if (parts[0] === ""){
				parts = parts.slice(1);
			}

			if (parts[parts.length - 1] === ""){
				console.warn("forgot how to do this");
			}

			for (var i = 0; i < parts.length; i++){
				value = value[parts[i]];
			}

			return value;
		},
		save: function(){

		}
	});



});