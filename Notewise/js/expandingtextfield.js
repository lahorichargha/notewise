// field_element is a text field dom element.
ExpandingTextField = function(field_element, options) {
  this.field_element = field_element;
  this.__resize_listeners = [];
  this.__registerHandlers();

  this.__min_width = 20;
  if (options && options["min_width"] !== undefined) {
    this.__min_width = options["min_width"];
  }

  this.__border_width = 2;
  if (options && options["border_width"] !== undefined) {
    this.__border_width = options["border_width"];
  }

  this.__current_width = 0;
  this.__layout();
};

// Returns the actual current width of the text field
ExpandingTextField.prototype.getWidth = function() {
  return this.__current_width;
};

// Sets the value of the text field.  Call this instead of setting value
// directly.
ExpandingTextField.prototype.setValue = function(value) {
  this.field_element.value = value;
  this.__layout();
}

// Causes the namefield to size itself
ExpandingTextField.prototype.__layout = function() {
  var width = this.__getContentWidth();
  this.field_element.style.width = width + 'px';
  this.field_element.value = this.field_element.value;
  this.__current_width = width;
  this.__notifyResizeListeners(width);
};

// Registers the necessary event handlers on the name field element.
ExpandingTextField.prototype.__registerHandlers = function() {
  Event.observe(this.field_element, 'keyup',
                function () { this.__layout(); }.bind(this));
};

// Registers a listener that gets called whenever the namefield resizes
// itself.
ExpandingTextField.prototype.registerResizeListener = function(listener) {
  this.__resize_listeners.push(listener);
};

// notify the Resize listeners
ExpandingTextField.prototype.__notifyResizeListeners = function(width) {
  for (var i = 0; i < this.__resize_listeners.length; i++) {
    this.__resize_listeners[i](width);
  }
};

// Gets the width of the text in the text field
ExpandingTextField.prototype.__getContentWidth = function(value) {
  // We add on enough padding for one more character, so that the text field
  // doesn't scroll from the addition of one character, after which we can
  // update it's width.  "@" seems to be the widest character in many fonts.
  var padding = Utils.getInputTextWidth(this.field_element, "@") +
                this.__border_width * 2;
  return Math.max(Utils.getInputTextWidth(this.field_element, value) + padding,
                  this.__min_width);
};
