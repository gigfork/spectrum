// IHazForm 0.2.0
// wow, you're reading source! You should probably be my friend on twitter:
//"Lovingly built by @HenrikJoreteg of &yet http://andyet.net"
// yup... that string is not commented because I want to execute my name as
// code your machine
// lint config, don't worry about it
/* global ich:true */
;(function () {
  var IHazForm = function (spec) {
    var f = function () {}, // empty func
      item
      
    this.ich = window.ich || require('icanhaz')
    
    this.settings = {
      error: f,
      submit: f,
      reqMessage: 'This field is required',
      html5Validation: true
    }
    
    this.fields = spec.fields
    this.id = spec.id
    this.submitText = spec.submitText
    this.initialData = spec.data || {}
    delete spec.fields
    
    // apply options
    for (item in spec) {
      this.settings[item] = spec[item]
    }
    
    // apply field options
    this.fields.forEach(function (field) {
      var def = {
          errors: [],
          type: 'text',
          tests: [],
          textarea: field.widget === 'textarea',
          select: field.widget === 'select' && field.hasOwnProperty('options'),
          input: field.hasOwnProperty('widget') ? field.widget === 'input' : true,
          trim: true
        },
        item
      for (item in def) {
        if (!field.hasOwnProperty(item)) field[item] = def[item]
      } 
      
      // set our value if we've got one
      if (spec.data && spec.data.hasOwnProperty(field.name)) {
        field.value = field.initial = spec.data[field.name]
      } else {
        field.value = field.initial = ''
      }
      
    })
  }
  
  IHazForm.prototype.render = function () {
    var self = this
    if (!this.dom) {
      this.dom = this.domify(this.ich.form(this, true))
      this.dom.addEventListener('submit', function (e) {
        e.preventDefault() // stop submit, always
      }, true)
      this.dom.addEventListener('input', function (e) {
        self.handleInputChange.apply(self, arguments)
      }, true)
      this.dom.addEventListener('blur', function (e) {
        self.handleInputChange.apply(self, arguments);
      }, true);
      this.dom.addEventListener('change', function (e) {
        self.handleInputChange.apply(self, arguments);
      }, true);
      this.dom.addEventListener('invalid', function (e) {
        e.preventDefault();
      }, true);
    } else {
      this.dom.innerHTML = this.domify(this.ich.form(this, true)).innerHTML;
    }
    this.storeDomRef();
    this.fields.forEach(function (field) {
      if (field.type === 'select' && field.value) {
          field.inputEl.value = field.value + '';
      }
    });
    
    this.addButtonHandlers();
    return this.dom;
  };
  
  IHazForm.prototype.addButtonHandlers = function () {
    var self = this,
      buttons = this.dom.getElementsByTagName('button', this.dom),
      i = 0,
      l = buttons.length;
    
    for (; i < l; i++) {
      buttons[i].addEventListener('click', function (e) {
        var cls = e.target.className,
          handler;
        if (self.submitRe.test(cls)) {
          self.handleSubmit();
          e.stopPropagation();
          return false;
        } else {
          handler = self.settings[cls];
          if (handler) {
            e.preventDefault();
            e.stopPropagation();
            handler.call(self);
            return false;
          }
        }
        // fall through
      }, true);
    }
  };
  
  IHazForm.prototype.handleSubmit = function (e) {
    var self = this;
    if (self.settings.preSubmit) self.settings.preSubmit.call(self);
    this.validate(function (valid) {
      if (valid) {
        var data = self.data();
        self.settings.submit(data, self.diffData(data));
      } else {
        self.settings.error(self);
      }  
      self.render();
    });
  };
  
  IHazForm.prototype.data = function () {
    var results = {};
    this.fields.forEach(function (field) {
      // trim if setting and available for brower and value type
      results[field.name] = (field.trim && field.value && field.value.trim) ? field.value.trim() : field.value;
    });
    if (this.settings.clean) {
      results = this.settings.clean(results);
    }
    return results;
  };
  
  IHazForm.prototype.diffData = function (newData) {
    var orig = this.initialData,
      diff = {},
      changed;
    for (var key in newData) {
      if (newData[key] !== orig[key]) {
        changed = true;
        diff[key] = newData[key]
      }
    }
    return changed ? diff : undefined
  }
  
  // this way we just store the value in memory away from the dom
  // then we can re-render whenever we want, without losing the value
  IHazForm.prototype.handleInputChange =  function (e) {
    var target = e.target,
        type = target.field.type
    target.field.value = function () {
      if (['range', 'number'].indexOf(type) !== -1) {
        return target.valueAsNumber
      } else if (type === 'date') {
        return target.valueAsDate
      } else {
        return target.value
      }
    }()
  }
  
  IHazForm.prototype.clearAll = function () {
    this.fields.forEach(function (field) {
      field.inputEl.value = ''
      field.errors = []
    })
    return true
  }
  
  IHazForm.prototype.validate = function (cb) {
    var self = this,
      isValid = true
    
    // async loop for each field
    this.asyncForEach(this.fields, function (field, fieldLoopCb) {
      var tests = field.tests instanceof Array ? field.tests : [field.tests]
      field.errors = [] // clear errors
      if (field.required && (!field.value || field.value.length === 0)) {
        isValid = false
        field.errors.push(field.reqMessage || self.settings.reqMessage)
      }
      
      // html5 error message handling
      if (self.settings.html5Validation && field.inputEl.validationMessage) {
        isValid = false
        field.errors.push(field.inputEl.validationMessage)
      }
      
      // async loop for each test
      self.asyncForEach(tests, function (test, loopCb) {
        var passed = false
        // if we're ignoring same values.. carry on
        if (test.ignoreSame && field.value === field.initial) {
          loopCb(null)
        } else {
          if (test.async) {
            test.test.call(self, field.value, self, function (passed) {
              if (!passed) {
                isValid = false
                field.errors.push(test.message)
              }
              loopCb(null, passed)
            })
          } else {
            passed = test.test.call(self, field.value, self)
            if (!passed) {
              isValid = false
              field.errors.push(test.message) 
            }
            loopCb(null, passed)
          }
        }
      }, fieldLoopCb)
    }, function () {
      cb(isValid)
    })
  }
  
  IHazForm.prototype.storeDomRef = function () {
    var self = this
    this.fields.forEach(function (field) {
      field.inputEl = self.dom.querySelector('[name="'+ field.name +'"]')
      field.inputEl.field = field
      field.labelEl = self.dom.querySelector('label[for="'+ field.id +'"]')
    })
  }
  
  IHazForm.prototype.domify = function (str) {
    var div = document.createElement('div')
    div.innerHTML = str
    return div.querySelector('form')
  }
  
  // from caolan's async.js lib
  // async.forEach method
  IHazForm.prototype.asyncForEach = function (arr, iterator, cb) {
    if (!arr.length) return cb()
    var completed = 0
    arr.forEach(function (x) {
      iterator(x, function (err) {
        if (err) {
          cb(err)
          cb = function () {}
        } else {
          completed += 1
          if (completed === arr.length) {
            cb()
          }
        }
      })
    })
  }
  
  IHazForm.prototype.submitRe = /(^|\s)submit(\s|$)/
  IHazForm.prototype.cancelRe = /(^|\s)cancel(\s|$)/

  if (typeof exports !== 'undefined') {
    module.exports = IHazForm
  } else {
    window.IHazForm = IHazForm
  }
})()