class Admin {
	constructor(selector) {
		// Store the jQuery object for the selected element
		this.$element = this.$(selector);
		this.initEvents();
	}

	initEvents() {
		this.$element.on('click', e => this.viewTable);
		// this.$(document).on('click', 'a[data-dt-action="view"]', e => this.viewTable);
		// document.querySelector(".like-box").addEventListener("click", e => this.ourClickDispatcher(e))
	}

	// methods
	// viewTable(e) {}
}

// Usage example:
(function ($) {
	$(document).ready(function () {
		// Create an instance of the class for an element with ID 'myButton'
		const viewLink = new Admin('a[data-dt-action="view"]');
	});
})(JQuery);
