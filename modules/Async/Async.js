define("Async", ["Stylesheet"], function(Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Async/Async.css");

	var Async = Base2.extend({
		call: function(ctx, value){
			var d, cb;
			if (this.cbs){
				for (var i = 0; i < this.cbs.length; i++){
					cb = this.cbs[i];
					// try {
						// d is a "delay" returned from a cb
						d = cb.call(ctx, value);
						if (d){
							// this should wire up both cb and eb..?
							d.then && d.then(cb.c);
						}
					// } catch (e) {
					// 	cb.c.error(ctx, e);
					// }

				}
			}
		},
		exec: function(){
			// using a.call(null, arg) is a little wonky
			// a.exec(a, r, g, s) is better
			// and a.call(null, arg) or a.call(null, args) could still point to .exec
			// and .exec could be orp, that defaults to this.exec_cbs(), for example
		},
		/*
		a.then(b) returns c
		if b() returns d,
			d.then(c)
		*/
		then: function(cb, eb){
			var c = new this.constructor();
			if (cb){
				this.cbs = this.cbs || [];
				
				cb.c = c;
				this.cbs.push(cb);

				if (cb.error){
					this.then(null, cb.catch);
				}

			}

			// if (eb){
			// 	this.ebs = this.ebs || [];

			// }
			return c;
		},
		error: function(){
			// where can this happen?
		},
		catch: function(eb){
			return this.then(null, eb);
		}
	});

	return Async;
});