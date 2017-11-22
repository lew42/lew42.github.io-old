Module("lew42", [], function(require, exports, module){

document.ready = new Promise((res, rej) => {
	if (/comp|loaded/.test(document.readyState)){
		res();
	} else {
		document.addEventListener("DOMContentLoaded", res);
	}
});

const lew42 = module.exports = View();

document.ready.then(() => {
	document.body.appendChild(lew42.el);
});


});