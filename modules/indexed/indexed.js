define("indexed/", ["Base", "evented", "View/"], function(Base, evented, View){

// namespaces suck - avoid like the plague
	// need to come up with a good name early on, because
	// its hard to rename later
	// and there's a large overhead
	// why not let each developer name their variables?
	// cat, or gato?

var IndexedView = View.extend({
	render: function(){
		this.append()
	}
});

// mvp: absolute simplest set of working features
var Indexed = Base.extend(evented, {
	log: define.log.on,
	instantiate: function(){
		this.events = {};

		this.assign.apply(this, arguments);
	},
	add: function(){
		return this.append.apply(this, arguments);
	},
	append: function(item){
		return this.new(item);
	},
	new: function(item){
		this.log.group("new", item);
		// ids might not be absolutely necessary, but just do it - not much harm in it
		var id = ++this.items.length;

		if (!is.obj(item)){
			// does the handle point to wrapped item, or item.value?
				// this should be configurable...
				// keeping handles in sync might be tricky..
			item = this.wrap(item);
		}

		item.id = id;
		this.items[id] = item;

		//optional
		// these lines of code should be linked to the item interface definition
		// !item.index && (item.index = this);
		// item.indices && item.indices.push(this);

		console.log("items", this.items);
		this.emit("new", item);

		this.log.end();

		return item;
	},
	remove: function(){

	},
	wrap: function(value){
		console.error("only use objects, for now");
		return new this.Item(value);
	},
	save: function(){
		if (!this.name)
			console.error("must use a name");
		// save at root with this.name?

		this.view && this.view.update();

		this.log("saving", this.json(true));
		// can't stringify items w/ references...
		window.localStorage.setItem(this.name, this.json());
	},
	load: function(){
		this.log.group("load", this.name);
		// load from root with this.name?
		this.items = JSON.parse(window.localStorage.getItem(this.name));
		this.log("load items", this.items);
		if (!this.items){
			this.log("not found");
			this.items = { length: 0 };
			this.save();
		}

		this.on("new", function(){
			console.log("on new");
			this.save();
		}.bind(this));

		this.log.end();
	},
	json: function(pretty){
		return pretty ? JSON.stringify(this.items, null, 3) : JSON.stringify(this.items);
	},
	data: function(){
		return this.items;
	},
	autosave: function(){
		// call this to enable autosaving
		this.on("new", function(){
			// view it, save it, 
		}) 

	},
	render: function(){
		this.view = View({
			idx: this,
			update: function(){
				this.content.empty().append(this.idx.json(true))
			}
		}).addClass("indexed").append({
			bar: View(this.name),
			controls: View(function(){
				// add item
			}.bind(this)),
			content: View({tag: "pre"})
		});

		console.log("content", this.view.content);

		this.view.update();

		if (!this.view.parent){
			document.body.appendChild(this.view.el);
			// this.view.appendTo(document.body);
		}
	}
});


/*
Indexed (saved order []) vs Unique (ID'd)

Or, Indexed is the data, and List is the .order props...
*/

var Item = Base.extend({
	data: function(){

	},
	save: function(){
		// if this.index, then save w/in that index
		// if multiple indices, save within them?
			// maybe each index can ask for a custom set of meta data?

			// if an index is found, save all data within that index?
			// again, the index could subscribe to either ALL the data, or some of it
				// and then its either cached, or still needs to be fully loaded
				// I think complete loading only is best, for now
		// So, save to all indices
		// We can have a root index
		// And, shouldn't indices be able to use non-numeric (property names)?
	},
	equals: function(obj){
		for (var i in obj){
			if (this[i] !== obj[i]){
				return false
			}
		}
		return true;
	}
});

return Indexed;

})