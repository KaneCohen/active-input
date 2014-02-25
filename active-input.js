/**
 * Active Input - enable disable input action based on the input
 * version 0.1.0
 * Kane Cohen [KaneCohen@gmail.com] | https://github.com/KaneCohen
 * @preserve
 */
(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(jQuery);
	}
}(function($) {
	$.fn.activeInput = function(options) {
		var vals = [], args = arguments, ai = null;
		var o = $.extend(true, {}, options);
		o.elements = $(this.selector);
		o.selector = this.selector;

		this.each(function() {
			o.element = $(this);
			ai = $(this).data('activeInput');
			if (ai) {
				ai.trigger.apply(ai, args);
				vals.push(ai.o.element);
			} else if ($.type(options) != 'string') {
				ai = new ActiveInput(o);
			}
		});

		if (vals.length == 1) {
			return vals[0];
		} else if (vals.length > 1) {
			return vals;
		}
		return this;
	};

	function ActiveInput(o) {
		this.init(o);
	}

	ActiveInput.prototype = {
		o: {},
		d: {
			element:   null,
			minChars:  1,    // Equals or more
			maxChars:  null, // Less or equals
			stripHtml: false,
			button:    null, // null or element
			counter:   null,
			input:     null, // null, element, array of elements
			/** Example:
						input: [{
							input:  null,
							counter:  null,
							minChars: 1
						}],
			*/
			form:      false,
			classes: {
				negative: 'negative'
			},
			callbacks: {
				click:   function(){},
				update:  function(){},
				stop:  function(){}
			}
		},
		v: {},
		b: {
			initData: null,
			button: null,
			input: []
		},

		init: function(options) {
			var self = this;
			this.o = $.extend(true, {}, this.d, options);
			this.v = $.extend(true, {}, this.b);
			if (! this.o.form && this.o.input === null) {
				this.o.input = this.o.element.find('input, textarea').first();
			}
			if (this.o.input instanceof Array) {
				$.each(this.o.input, function(k,v) {
					if (v.input.length !== 0) {
						self.v.input.push({
							input: v.input,
							counter: v.counter || self.o.counter,
							minChars: v.minChars || self.o.minChars,
							maxChars: v.maxChars || self.o.maxChars,
							stripHtml: v.stripHtml || self.o.stripHtml,
							form: false
						});
					}
				});
			} else if (this.o.input) {
				this.o.input.each(function() {
					self.v.input.push({
						input: $(this),
						counter: self.o.counter,
						minChars: self.o.minChars,
						maxChars: self.o.maxChars,
						stripHtml: self.o.stripHtml,
						form: false
					});
				});
			}

			if (this.o.form) {
				this.v.input.push({
					input: this.o.element,
					form: true
				});
				this.v.initData = this.o.element.serialize();
			}

			if (this.v.input.length === 0) {
				console.log('ActiveInput.Error: activeInput must be bind to at least one input element.');
				return false;
			}
			this.v.button = this.o.button;
			if (this.o.button === null) {
				this.v.button = this.o.element.find('button').last();
			}

			if (this.o.form) {
				this.v.button.prop('disabled', true);
			}

			if (this.validate()) {
				this.v.button.prop('disabled', false);
			} else {
				this.v.button.prop('disabled', true);
			}

			this.initEvents();
			this.initCallbacks();
			this.o.element.data('activeInput', this);
			return this;
		},

		initEvents: function() {
			var self = this;
			this.refresh();
			$.each(this.v.input, function(k,v) {

				if (v.form) {
					v.input.on('input.activeInput keydown.activeInput change.activeInput reset.activeInput', function(e) {
						setTimeout(function() {
							if (self.validate(v.input)) {
								self.v.button.prop('disabled', false);
							} else {
								self.v.button.prop('disabled', true);
							}
							self.trigger('stop', self, e);
						}, 1);
					});
					v.input.on('submit.activeInput', function() {
						self.v.button.prop('disabled', true);
						self.v.initData = $(this).serialize();
					});
				} else {
					var prevVal = v.input.val();
					v.input.on('input.activeInput change.activeInput', function() {
						var val = $.trim(v.input.val()).replace(/[\s]/gi, '');
						if (v.stripHtml) {
							val = val.replace(/(<([^>]+)<)/gi, '');
						}
						if (val !== prevVal) {
							if (v.counter) {
								var l;
								if (v.minChars !== null) {
									l = self.length(val) - v.minChars;
									v.counter[0].innerHTML = l;
									if (l < 0) {
										v.counter[0].classList.add(self.o.classes.negative);
									} else {
										v.counter[0].classList.remove(self.o.classes.negative);
									}
								}
								if (v.maxChars !== null) {
									l = v.maxChars - self.length(val);
									if (l < 0) {
										v.counter[0].classList.add(self.o.classes.negative);
									} else {
										v.counter[0].classList.remove(self.o.classes.negative);
									}
								}
							}

							if (self.validate(v.input)) {
								self.v.button.prop('disabled', false);
							} else {
								self.v.button.prop('disabled', true);
							}
							prevVal = val;
						}
					});
					v.input.on('focusout.activeInput', function(e) {
						self.trigger('stop', self, e);
					});
				}

			});

			this.v.button.on('click.activeInput', function(e) {
				self.trigger('click', self, e);
			});
		},

		validate: function(input) {
			var self = this;
			if (self.trigger('update', this, input || null)) {
				var valid = true;
				$.each(this.v.input, function(k,v) {
					if (v.form) {
						if (v.input.serialize() == self.v.initData) {
							valid = false;
							return false;
						}
					} else {
						var l = self.length(v.input.val());
						if (v.minChars !== null && l < v.minChars) {
							valid = false;
							return false;
						}
						if (v.maxChars !== null && l > v.maxChars) {
							valid = false;
							return false;
						}
					}
				});
				return valid;
			}
			return false;
		},

		reset: function() {
			var self = this;
			$.each(this.v.input, function(k,v) {
				if (v.form) {
					self.v.initData = v.input.serialize();
					self.v.button.prop('disabled', true);
				}
			});
		},

		refresh: function() {
			var self = this;
			$.each(this.v.input, function(k,v) {
				if (v.counter) {
					var val = v.input.val(),
					    l;
					if (v.minChars !== null) {
						l = self.length(val) - v.minChars;
						v.counter.text(l);
						if (l < 0) {
							v.counter[0].classList.add(self.o.classes.negative);
						} else {
							v.counter[0].classList.remove(self.o.classes.negative);
						}
					}
					if (v.maxChars !== null) {
						l = v.maxChars - self.length(val);
						if (l < 0) {
							v.counter[0].classList.add(self.o.classes.negative);
						} else {
							v.counter[0].classList.remove(self.o.classes.negative);
						}
					}
				}
			});
		},

		destroy: function() {
			if (this.v.input instanceof Array) {
				$.each(this.v.input, function(k,v) {
					v.input.off('.activeInput');
				});
			} else {
				this.v.input.off('.activeInput');
			}
			this.o.element.off('update');
			this.o.element.off('click');
			this.o.element.off('.activeInput');
			this.o.element.removeData('activeInput');
		},

		initCallbacks: function() {
			var self = this;
			$.each(this.o.callbacks, function(k) {
				self.o.callbacks[k] = function() {
					var args = Array.prototype.slice.call(arguments);
					return self.o.element.triggerHandler(k, args);
				};
			});
		},

		length: function(value) {
			return $.trim(value).replace(/[\s]/gi, '').length;
		},

		trigger: function(name) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (this.o.callbacks[name]) {
				if (this.o.callbacks[name].apply(this, args) === false)
					return false;
			}
			if (this[name]) {
				if (this[name].apply(this, args) === false)
					return false;
			}
			return true;
		}
	};
}));
