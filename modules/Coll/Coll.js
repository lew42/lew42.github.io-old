define("Coll", ["Stylesheet"], function(Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Coll/Coll.css");

	/*
	Maybe this is more like an interface than an implementation.
	--> mixin
	--> or Class
	--> or... interface

	*/

	var Coll = Base2.extend({
		set: function(){
			/*
			.set({ prop: value });
			if (this.prop && this.prop.set)
				this.prop.set(value);
			else {
				this.append({ prop: value })
			}
			*/
		},
		append: function(){
			/*
			.append({ prop: value })
			like assign: overrides the property
			also, appends value to the end of the coll 
			*/
		}
	});

	return Coll;
});