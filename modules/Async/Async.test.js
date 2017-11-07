Module(["Async"], function(Async){


	var Q = Base2.extend({
		call: function(ctx, args){
			if (this.cbs){
				for (var i = 0; i < this.cbs.length; i++){
					this.cbs[i].call(ctx, args);
				}
			}
		},
		apply: function(ctx, args){
			if (this.cbs){
				for (var i = 0; i < this.cbs.length; i++){
					this.cbs[i].apply(ctx, args);
					// return value is Aysnc?
				}
			}
			// no return value? 
		},
		then: function(cb){
			this.cbs = this.cbs || [];
			this.cbs.push(cb);
			// return ... new Q()?
		}
	});

	var log = logger(true);
	Async.test = function(Async){

		// Test("Q", function(){
		// 	var q = Q();
		// 	q.then(function(){
		// 		console.log("fn");
		// 	});

		// 	var q2 = Q();
		// 	q2.then(function(){
		// 		console.log("q2");
		// 	});

		// 	q.then(q2);

		// 	// q.call();
		// });

		Test("one", function(){

			var a = Async();
			var b = Async();

			a.then((v) => log("a:", v));
			b.then((v) => log("b:", v));

			a.then(b).then();

			a.call(null, "a");	


		});
	};
	
});