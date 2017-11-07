Module(["Page"], function(Page){

	Page.test = function(Page){
		Test("one", function(){

			Page("/test-page/", function(){
				console.log("rendering /test-page/");
				View("Test PAge!!");
			});

			define("page-test-one", ["/test-page/"], function(page){
				page.render();
			});
		});

		Test("two", function(){

			var MyPage = Page.extend({
				constructs_fn: "content",
				render: function(){
					this.view = View().addClass("my-test-page");
					this.view.append(this.content);
				}
			});

			MyPage("/my-test-page/", ["Stylesheet"], function(Stylesheet){
				// this === page;
				console.dir(Stylesheet);
				View("page content");
				console.log("my-test-page content");
			});

			define("page-test-two", ["/my-test-page/"], function(page){
				page.render();
			});
		});
	};
	
});