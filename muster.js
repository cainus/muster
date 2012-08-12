var Muster = function(){
  this.validation = {required : [], optional : true};
  this.keyValidators = [];
  this.docValidators = [];
};

Muster.prototype.key = function(keyname){
  return new KeyValidator(this, keyname);
};


Muster.prototype.addKeyValidator = function(kv){
  this.keyValidators.push(kv);
};

Muster.prototype.mustHaveKeys = function(fields){
  this.validation.required = fields;
  return this;
};

Muster.prototype.mayHaveKeys = function(fields){
  this.validation.optional = fields;
  return this;
};

Muster.prototype.mustPass = function(message, callback){
  this.docValidators.push({"message" : message, "callback" : callback});
  return this;
};

Muster.prototype.errors = function(doc, resourceName){
  var properties = keys(doc);

  var errors = [];
  errors = union(errors, this.getDocumentErrors(doc));
  errors = union(errors, this.getMissingAttributes(this.validation.required, properties));
  if (this.validation.optional !== true){
    errors = union(errors, this.getUnexpectedAttributes(this.validation.optional, this.validation.required, properties));
  }
  errors = union(errors, this.getInvalidAttributes(doc));

  return errors;
};

Muster.prototype.getDocumentErrors = function(doc){
  var errors = [];
  for(var i = 0; i < this.docValidators.length; i++){
    var obj = this.docValidators[i];
    if (!obj.callback(doc)){
      errors.push({type : 'InvalidDocument', message : obj.message, detail : doc});
    }
  }
  return errors;
};

Muster.prototype.check = function(doc){
  var error = this.error(doc);
  if (error !== false){
    throw error;
  }
};
Muster.prototype.checkAll = function(doc){
  var errors = this.errors(doc);
  if (errors.length > 0){
    throw errors;
  }
};

Muster.prototype.error = function(doc){
  var properties = keys(doc);
  var errors = [];
  errors = this.getDocumentErrors(doc);
  if (errors.length > 0){return errors[0];}

  errors = this.getMissingAttributes(this.validation.required, properties);
  if (errors.length > 0){return errors[0];}

  if (this.validation.optional !== true){
    errors = this.getUnexpectedAttributes(this.validation.optional, this.validation.required, properties);
  }
  if (errors.length > 0){return errors[0];}

  errors = this.getInvalidAttributes(doc);
  if (errors.length > 0){return errors[0];}
  return false;
};

Muster.prototype.getMissingAttributes = function(requiredProperties, incomingProperties){
  var missings = difference(requiredProperties, incomingProperties);
  var errors = [];
  for (var i = 0; i < missings.length; i++){
    var missing = missings[i];
    var error = {
      "type": "MissingAttribute", 
      "message": "A key named '" + missing + "' is required but was not found.",
      "detail": missing
    };
    errors.push(error);
  }
  return errors;
};

Muster.prototype.getUnexpectedAttributes = function(optionalProperties, requiredProperties, incomingProperties){
  var allowedProperties = union(optionalProperties, requiredProperties);
  var extras = difference(incomingProperties, allowedProperties);
  var errors = [];
  for (var i = 0; i < extras.length; i++){
   var extra = extras[0];
   var error = {
    "type": "UnexpectedAttribute", 
    "message": "A key named '" + extra + "' was found but is not allowed.",
    "detail": extra 
    };
    errors.push(error);
  }
  return errors;
};

Muster.prototype.getInvalidAttributes = function(doc){
  var errors = [];
  for (var i = 0; i < this.keyValidators.length; i++){
    var validator = this.keyValidators[i];
    if (doc.hasOwnProperty(validator.keyname)){
      var error = validator.error(doc[validator.keyname]);
      if (error){
        errors.push(error);
      }
    }
  }
  return errors;
};



var KeyValidator = function(muster, keyname){
  this.muster = muster;
  this.keyname = keyname;
  this.message = "Key " + this.keyname + " had an unknown attribute error";
  this.callback = function(){return true;};
};

KeyValidator.prototype.setValidator = function(message, cb){
    this.message = message;
    this.callback = cb;
};

KeyValidator.prototype.error = function(val){
  if (!this.callback(val)){
    return {type : "InvalidAttribute",
            message : this.message,
            detail : val };
  }
  return false;
};

KeyValidator.prototype.mustMatch = function(regex){
  this.callback = function(val){
    if ((typeof val) === 'number'){
      val += '';
    }
    return val.match(regex);
  };
  this.message = "Key '" + this.keyname + "' was not in the correct format.";
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustBeAnEmailAddress = function(){
  // VERY loose definition of email address to avoid false negatives as much as possible.
  this.callback = function(val){
    return val.match(/^[^\s]+@[^\s]+$/);
  };
  this.message = "Key '" + this.keyname + "' was not an email address.";
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustBeOneOf = function(list){
  this.callback = function(val){
    return include(list, val);
  };
  this.message = "Key '" + this.keyname + "' was not a valid value.";
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustEqual = function(expected){
  this.callback = function(val){
    return val == expected;
  };
  this.message = "Key '" + this.keyname + "' was not the correct value.";
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustHaveLength = function(expectedOrComparator, expected){
  var comparator;
  if (expected === undefined){
    expected = expectedOrComparator;
    comparator = "==";
  } else {
    comparator = expectedOrComparator;
  }
  var callbacks = {
    '>' : function(val){  return val.hasOwnProperty("length") && (val.length > expected);},
    '<' : function(val){  return val.hasOwnProperty("length") && (val.length < expected);},
    '=' : function(val){  return val.hasOwnProperty("length") && (val.length == expected);},
    '==' : function(val){ return (val.hasOwnProperty("length") && (val.length == expected)); },
    '>=' : function(val){ return val.hasOwnProperty("length") && (val.length >= expected);},
    '=>' : function(val){ return val.hasOwnProperty("length") && (val.length >= expected);},
    '<=' : function(val){ return val.hasOwnProperty("length") && (val.length <= expected);},
    '=<' : function(val){ return val.hasOwnProperty("length") && (val.length <= expected);}
  };
  if (!!callbacks[comparator]){
    this.callback = callbacks[comparator];
  } else {
    throw "Comparator for mustHaveLength() must be one of >, <, ==, >=, or <=.";
  }
  var compWords = {
    '>' : 'greater than', 
    '<' : 'less than', 
    '=' : 'equal to', 
    '==' : 'equal to', 
    '>=' : 'greater than or equal to', 
    '=>' : 'greater than or equal to', 
    '<=' : 'less than or equal to', 
    '=<' : 'less than or equal to'
  };
  this.message = "Key '" + this.keyname + "' must have a length " + compWords[comparator] + " " + expected + ".";
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustBeA = function(type){
  var typestring = (typeof type).toLowerCase();
  if (!!type.name) typestring = type.name.toLowerCase();
  if ((typestring == 'array') || (typestring == 'object')){  
    this.message = "Key '" + this.keyname + "' must be an " + typestring;
  } else {
    this.message = "Key '" + this.keyname + "' must be a " + typestring;
  }
  this.callback = function(val){
    if (typestring == "array"){
      return Object.prototype.toString.call(val) == '[object Array]';
    }
    return (typeof val == typestring);
  };
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustBeADateString = function(){
  this.message = "Key '" + this.keyname + "' must be a valid ISO8601/RFC3339 date string.";
  this.callback = function(val){
    var re1 = "^([-+]?)(\\d{4,})(?:-?(\\d{2})(?:-?(\\d{2})" +
        "(?:[Tt ](\\d{2})(?::?(\\d{2})(?::?(\\d{2})(?:\\.(\\d{1,3})(?:\\d+)?)?)?)?" +
        "(?:[Zz]|(?:([-+])(\\d{2})(?::?(\\d{2}))?)?)?)?)?)?$";
    return val.match(re1);
  };
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustBeGreaterThan = function(gtVal){
  this.message = "Key '" + this.keyname + "' must be greater than " + gtVal;
  this.callback = function(val){return val > gtVal;};
  this.muster.addKeyValidator(this);
  return this.muster;
};
KeyValidator.prototype.mustBeLessThan = function(ltVal){
  this.message = "Key '" + this.keyname + "' must be less than " + ltVal;
  this.callback = function(val){return val < ltVal;};
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustPass = function(message, callback){
  this.setValidator(message, callback);
  this.muster.addKeyValidator(this);
  return this.muster;
};

KeyValidator.prototype.mustPassMuster = function(musterObj){
  var keyname = this.keyname;
  var callback = function(val){
    var error = musterObj.error(val);
    if (!!error.message){
      this.setValidator("Problem with key '" + keyname + "': " + error.message, callback);
    }
    return error === false;
  };
  this.setValidator('', callback);
  this.muster.addKeyValidator(this);
  return this.muster;
};

Muster.prototype.keyValidatorPrototype = KeyValidator.prototype;
Muster.keyValidatorPrototype = KeyValidator.prototype;

// util -----------------
function union(arr1, arr2){
  arr1 = arr1 || [];
  arr2 = arr2 || [];
  var arr3 = arr1.slice(0);
  for(var i = 0; i < arr2.length; i++){
    arr3.push(arr2[i]);
  }
  return arr3;
}

function include(arr, val){
  return (arr.indexOf(val) !== -1);
}

function difference(from, subtract){
  var diff = [];
  for(var i = 0; i < from.length; i++){
    if (!include(subtract, from[i])){
      diff.push(from[i]);
    }
  }
  return diff;
}

function keys(obj){
  var keysArr = [];
  for(var x in obj){
    if (obj.hasOwnProperty(x)){
      keysArr.push(x);
    }  
  }
  return keysArr;
}

module.exports = Muster;
