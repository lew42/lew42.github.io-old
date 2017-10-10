define("Base2/", ["Base"], function(Base){

var Base2 = Base.extend();

Base2.extend = function(){
	var Ext = function Ext(){
		if (!(this instanceof Ext))
			return new (Ext.bind.apply(Ext, [null].concat([].slice.call(arguments))));
		this.instantiate.apply(this, arguments);
	};
	Ext.assign = this.assign;
	Ext.assign(this);
	Ext.prototype = Object.create(this.prototype);
	Ext.prototype.constructor = Ext;
	Ext.prototype.assign.apply(Ext.prototype, arguments);
	return Ext;
};

return Base2;

});

/*
Notes:

This fails if you try to do this.constructor().  You must do `new this.constructor()`, otherwise `this` passes the instanceof test, and then `this` is re-instatiated.


Also, if, for whatever reason, you make a secondary reference to `this.constructor`:

this.SecondaryReference === this.constructor;

The same problem will happen:  `this.SecondaryReference()` will reinstantiate `this`, instead of creating a `new this.SecondaryReference()`.  (duh)

*/