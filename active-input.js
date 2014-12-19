/**
 * Active Input
 * version 0.2.0
 * Kane Cohen [KaneCohen@gmail.com] | https://github.com/KaneCohen
 * @preserve
 */
(function(undefined) {

  'use strict';
  var hasModule = (typeof module !== 'undefined' && module.exports);

  if (window.jQuery) {
    var $ = window.jQuery;
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
  }

  // Config defaults.
  var defaults = {
    element:   null,
    minChars:  1,     // Equals or more
    maxChars:  null,  // Less or equals
    stripHtml: false,
    button:    null,  // null or element
    counter:   null,
    count:    'up',   // up - start is minChars. down - start is maxChars.
    form:      false,
    input:     null   // null, element, array of elements
  };
  /** defaults.input example:
    input: [{
      input:  null,
      counter:  null,
      minChars: 1
      maxChars:  null,  // Less or equals
      count:    'up',
    }],
  */

  // Inner data holders values.
  var vals = {
    initData: null,
    button: null
  };

  var util = {
    checkable: /(checkbox|radio)/,
    key: /[a-z0-9_-]+|(?=\[\])/gi,
    events: {},
    trim: function(string) {
      return string.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '');
    },

    extend: function(target, source) {
      for(var key in source) {
        if(source.hasOwnProperty(key)) {
          target[key] = source[key];
        }
      }
      return target;
    },

    data: function(el, prop, value) {
      var p = 'data';
      var data = el[p] || {};
      if (typeof value === 'undefined') {
        if (el[p] && el[p][prop]) {
          return el[p][prop];
        } else {
          var dataAttr = el.getAttribute(p + '-' + prop);
          if (typeof dataAttr !== 'undefined') {
            return dataAttr;
          }
          return null;
        }
      } else {
        data[prop] = value;
        el[p] = data;
        return el;
      }
    },

    on: function(el, events, handler) {
      var prevEvents = this.data(el, 'events') || {},
          ev, i;
      if (typeof events === 'string') {
        events = events.match(/[\S]+/g);
        for (i = 0; i < events.length; i++) {
          ev = events[i];
          if (prevEvents[ev]) {
            prevEvents[ev].push(handler);
          } else {
            prevEvents[ev] = [handler];
          }
          el.addEventListener(ev.split('.')[0], handler);
        }
        this.data(el, 'events', prevEvents);
      }
    },

    off: function(el, events, handler) {
      var prevEvents = this.data(el, 'events') || {},
          ev, i, v, k;
      if (typeof events === 'string') {
        events = events.match(/[\S]+/g);
        for (i = 0; i < events.length; i++) {
          ev = events[i];
          if (handler) {
            el.removeEventListener(ev.split('.')[0], handler);
          } else if (prevEvents[ev]) {
            prevEvents[ev].forEach(function(handler, k) {
              el.removeEventListener(ev.split('.')[0], handler);
              prevEvents[k] = prevEvents[ev].slice(k+1);
            });
          } else if (ev[0] === '.') {
            for (k in prevEvents) {
              if (k.indexOf(ev) > -1) {
                prevEvents[k].forEach(function(handler, j) {
                  el.removeEventListener(k.split('.')[0], handler);
                  prevEvents[k] = prevEvents[k].slice(j+1);
                });
              }
              if (prevEvents[k].length === 0) {
                delete prevEvents[k];
              }
            }
          }
        }
      }
    },

    parents: function(el, els) {
      els || (els = []);
      var p = el.parentNode;
      if (p) {
        els.push(p);
        this.parents(p, els);
      }
      return els;
    },

    isDisabled: function(el) {
      var disabled = false;
      if (el.disabled) return true;
      // Check if this element has parents that are fieldset elements and are disabled
      this.parents(el).forEach(function(v, k) {
        if (v.tagName == 'FIELDSET' && v.disabled) {
          disabled = true;
        }
      });
      return disabled;
    },

    findInputElements: function(el) {
      var self = this;
      var els = el.querySelectorAll('input, select, textarea, keygen');
      els = Array.prototype.filter.call(els, function(v, k) {
        if (v.name && ! self.isDisabled(v)) {
          var chk = self.checkable.test(v.type);
          if ((chk && v.checked) || ! chk) {
            return true;
          }
        }
        return false;
      });
      return els;
    },

    serializeObject: function(el) {
      var self = this, data = {};
      var els = this.findInputElements(el);
      els.forEach(function(input) {
        var keys = input.name.match(key);
        self.buildObject(input, data, keys);
      });
      return data;
    },

    serialize: function(el) {
      var data = {}, string = '', k;
      var els = this.findInputElements(el);
      els.forEach(function(input) {
        var name = input.name;
        data[name] = input.value;
      });
      for (k in data) {
        string += encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
      }
      return string;
    },

    buildObject: function(input, pointer, keys) {
      var l = keys.length, item, i, k;
      for (i = 0; i < l - 1; i++) {
        k = keys[i];
        if (k.length > 0) {
          // If key has at least one character.
          if (! pointer[k]) {
            // And key is not yet set at the pointer.
            if (keys[i + 1].length === 0) {
              // And next key is empty. Set array.
              pointer[k] = [];
            } else {
              // And next key is not empty. Set object.
              pointer[k] = {};
            }
          }
          // Set pointer to the inner key.
          pointer = pointer[k];
        } else {
          // No characters in key
          if (keys[i + 1].length === 0) {
            // And next key is empty.
            item = [];
            // Push new array to the array.
            pointer.push(item);
          } else {
            // Next key is not empty.
            item = {};
            // Push new object to array.
            pointer.push(item);
          }
          // Update pointer to the item of the array.
          pointer = item;
        }
      }
      // Deal with setting value.
      k = keys[l - 1];
      if (k.length > 0) {
        pointer[k] = input.value;
      } else {
        pointer.push(input.value);
      }
      return pointer;
    }
  };

  function ActiveInput(o) {
    this.o = util.extend(defaults, o);
    this.v = util.extend({}, vals);
    this.v.input = [];
    this.v.events = {};
    this.init();
  }

  ActiveInput.prototype = {
    init: function() {
      var self = this, o = this.o, input, counter;
      if (typeof o.element === 'string') {
        o.element = document.querySelector(o.element);
      }

      if (! o.form && o.input === null) {
        o.input = o.element.querySelector('input, textarea, select');
      }
      if (o.input instanceof Array) {
        o.input.forEach(function(v, k) {
          if (v.input.length !== 0) {
            input = v.input;
            counter = v.counter || o.counter;
            if (typeof input === 'string') input = o.element.querySelector(input);
            if (typeof counter === 'string') counter = o.element.querySelector(counter);
            self.v.input.push({
              input: input,
              counter: counter,
              count: v.count || o.count,
              minChars: v.minChars || o.minChars,
              maxChars: v.maxChars || o.maxChars,
              stripHtml: v.stripHtml || o.stripHtml,
              form: false
            });
          }
        });
      } else if (o.input) {
        input = o.input;
        counter = o.counter;
        if (typeof input === 'string') input = o.element.querySelectorAll(input);
        if (typeof counter === 'string') counter = o.element.querySelector(counter);
        if (typeof input.length === 'undefined') {
          input = [input];
        }
        Array.prototype.forEach.call(input, function(v) {
          self.v.input.push({
            input: v,
            counter: counter,
            count: o.count,
            minChars: o.minChars,
            maxChars: o.maxChars,
            stripHtml: o.stripHtml,
            form: false
          });
        });
      }

      if (o.form) {
        var form = o.form;
        if (typeof o.form === 'string') {
          form = document.querySelector(o.form);
          if (! o.element) {
            o.element = form;
          }
        }
        this.v.input.push({
          input: form,
          form: true
        });
        this.v.initData = util.serialize(form);
      }

      if (this.v.input.length === 0) {
        console.log('ActiveInput.Error: activeInput must be bind to at least one input element.');
        return false;
      }
      this.v.button = o.button;
      if (this.o.button === null) {
        var buttons = o.element.querySelectorAll('button');
        this.v.button = buttons[buttons.length-1];
      }

      if (this.o.form) {
        this.v.button.disabled = true;
      }

      if (this.validate()) {
        this.v.button.disabled = false;
      } else {
        this.v.button.disabled = true;
      }

      this.initEvents();
      this.o.element.activeInput = this;
      return this;
    },

    initEvents: function() {
      var self = this;
      this.refresh();
      this.v.input.forEach(function(v) {

        if (v.form) {
          util.on(v.input, 'input.activeInput change.activeInput reset.activeInput', function(e) {
            setTimeout(function() {
              if (self.validate(v.input, e)) {
                self.v.button.disabled = false;
              } else {
                self.v.button.disabled = true;
              }
              self.trigger('stop', self, e);
            }, 1);
          });
          util.on(v.input, 'submit.activeInput', function() {
            self.v.button.disabled = true;
            self.v.initData = util.serialize(v.input);
          });
        } else {
          var prevVal = v.input.value;
          util.on(v.input, 'input.activeInput change.activeInput', function(e) {
            var val = util.trim(v.input.value).replace(/[\s]/gi, '');
            if (v.stripHtml) {
              val = val.replace(/(<([^>]+)<)/gi, '');
            }
            if (val !== prevVal) {
              if (v.counter) {
                var l;
                if (v.count === 'up' && v.minChars !== null) {
                  l = self.length(val) - v.minChars;
                  v.counter.innerHTML = l;
                  if (l < 0) {
                    v.counter.classList.add('negative');
                  } else {
                    v.counter.classList.remove('negative');
                  }
                }
                if (v.count === 'down' && v.maxChars !== null) {
                  l = v.maxChars - self.length(val);
                  v.counter.innerHTML = l;
                  if (l < 0) {
                    v.counter.classList.add('negative');
                  } else {
                    v.counter.classList.remove('negative');
                  }
                }
              }

              if (self.validate(v.input, e)) {
                self.v.button.disabled = false;
              } else {
                self.v.button.disabled = true;
              }
              prevVal = val;
            }
          });
          util.on(v.input, 'focusout.activeInput', function(e) {
            self.trigger('stop', self, e);
          });
        }

      });

      util.on(this.v.button, 'click.activeInput', function(e) {
        self.trigger('click', self, e);
      });
    },

    validate: function(input, e) {
      var self = this;
      if (self.trigger('update', this, input, e)) {
        var valid = true;
        this.v.input.forEach(function(v, k) {
          if (v.form) {
            if (util.serialize(v.input) == self.v.initData) {
              valid = false;
              return false;
            }
          } else {
            var l = self.length(v.input.value);
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
      this.v.input.forEach(function(v) {
        if (v.form) {
          self.v.initData = util.serialize(v.input);
          self.v.button.disabled = true;
        }
      });
    },

    refresh: function() {
      var self = this;
      this.v.input.forEach(function(v) {
        if (v.counter) {
          var val = v.input.value,
              l;
          if (v.count == 'up' && v.minChars !== null) {
            l = self.length(val) - v.minChars;
            v.counter.innerHTML = l;
            if (l < 0) {
              v.counter.classList.add('negative');
            } else {
              v.counter.classList.remove('negative');
            }
          }
          if (v.count == 'down' && v.maxChars !== null) {
            l = v.maxChars - self.length(val);
            v.counter.innerHTML = l;
            if (l < 0) {
              v.counter.classList.add('negative');
            } else {
              v.counter.classList.remove('negative');
            }
          }
        }
      });
    },

    destroy: function() {
      if (Array.isArray(this.v.input)) {
        this.v.input.forEach(function(v) {
          util.off(v.input, '.activeInput');
        });
      } else {
        util.off(this.v.input, '.activeInput');
      }
      util.off(this.o.element, '.activeInput');
      delete this.o.element.activeInput;
    },

    length: function(value) {
      return util.trim(value).replace(/[\s]/gi, '').length;
    },

    on: function(e, cb) {
      this.v.events[e] = cb;
    },

    off: function(e) {
      delete this.v.events[e];
    },

    trigger: function(name) {
      var args = Array.prototype.slice.call(arguments, 1);
      if (this.v.events[name]) {
        if (this.v.events[name].apply(this, args) === false)
          return false;
      }
      if (this[name]) {
        if (this[name].apply(this, args) === false)
          return false;
      }
      return true;
    }
  };

  if (hasModule) {
    // CommonJS module is defined.
    module.exports = ActiveInput;
  } else if (typeof define === 'function' && define.amd) {
    // AMD module is defined.
    define('activeInput', function() {
      return ActiveInput;
    });
  }

}).call(this);
