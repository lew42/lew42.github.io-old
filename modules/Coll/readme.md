# Combine objects (handles) and arrays (ordered)

Requirements:
* composable and cached

You could have a render function:

coll.render(){
	return this.a + this.b + this.c;
}

or

coll.render(){
	return this.reduce((x) => x += x);
		// where .reduce() uses .each() which uses numeric (ordered) properties, until .length
}

But, this is not cached...

So, what if you wanted `coll.value` to always be current.  That should be a paradigm for these object-value wrappers.


## Option:  Use objects with numeric property names and handles (string prop names)
## Option:  Use objects 
