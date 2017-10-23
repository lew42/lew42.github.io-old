define("Async", ["Stylesheet"], function(Stylesheet){
	var styles = Stylesheet();
	styles.request("/modules/Async/Async.css");

	var Async = Base2.extend({
		// a.then(b), !a.ready(), so we return new Async that resolves when a does
		instantiate: function(from){
			if (from instanceof Async){
				from.then
			}
		},
		/*
		.then() creates a dependency, or a sequence
			might be synchronous or async?
			we could delay sync by 0ms to make it more like Promises

		.then() could be thought of as .addCB(cb) || .addAsync(async)
		*/
		then: function(cb){
			var ret;
			this.cbs.push(cb);

			this.cbs.push({
				cb: cb,
				b: Async()
			});

			// either way, we need to return a new Async...
			// we don't know if it returns an async, or w/e
			if (this.ready()){
				ret = this.exec_cb(cb);
				if (ret instanceof Async){
					return ret;
				} else {
					return Async(ret);
				}
			} else {
				return Async.from(this, cb);

				// basically, just create a new Async, and link it up?
				return Async(this).then(cb);
			}
		},
		// aka resolve? aka fulfill? aka ping? aka isReady? ugh, i dunno
		/* this is just like... .maybeExec() 
		for most cases, .ready() means .exec()
			but, this allows you to only .exec() in certain cases
			like, if (this.value) exec() 
				// only execs if value is truthy 
		then, .ready() can be called by anyone, anytime... but it should
			be called after an update, to re-check the value/state, and
			maybe .exec() */
		ready: function(value){
			this.exec(value);
			return // ??
		},
		/*
		all cbs execute synchronously (parallel-ish: that is, without affecting each other)
		return values can be fns or asyncs, and are wired to the returned Async from that specific .then() call...
		*/
		exec: function(arg){
			for (var i = 0; i < this.cbs.length; i++){
				this.exec_cb(this.cbs[i], arg);
			}
		},
		exec_cb: function(cb, arg){
			if (cb instanceof Async){
				return cb.ready.call(cb, arg);
			} else {
				return cb.call(this.ctx || this, arg);
			}
		},
		handler: function(){}, // or
		callback: function(arg){
			this.set(arg);
			// no return?
		},
		set: function(arg){
			// this can't really be a smart assign?
			// well, we can't really... chain it
			// the return value here is important 
			// if we return self, we're essentially delaying the Async process?
			// maybe that's good?

			// .then(a) --> a.set()
			// .then(a).then(b) --> a.set().then(b) --> b.set()

			// event.then(a) --> a.set()?
		}
	}).assign({
		from: function(a, cb){
			var ret;
			if (a.ready()){
				ret = a.exec_cb(cb);
				if ()
			}
		}
	});

	var Event = Async.extend({
		ready: function(){
			return false;
		}
	});

});