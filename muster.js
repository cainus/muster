const _ = require('underscore')

var Muster = function(){
  this.validation = {required : [], optional : true}
  this.fieldValidators = {}
  this.keyValidators = []
  this.mode = "validatable"
  this.pendingKey = null;
}

Muster.prototype.key = function(keyname){
  this.pendingKey = keyname;
  return new KeyValidator(this, keyname);
}


Muster.prototype.addKeyValidator = function(kv){
  this.keyValidators.push(kv);
}

Muster.prototype.mustHaveKeys = function(fields){
  this.validation.required = fields;
  return this;
}

Muster.prototype.mayHaveKeys = function(fields){
  this.validation.optional = fields;
  return this;
}

Muster.prototype.expectField = function(fieldname){
  var expectation = {}
  return expectation;
}

Muster.prototype.addFieldValidator = function(fieldName, validator, message){
  this.fieldValidators[fieldName] = {"validator" : validator, "message" : message}
}

Muster.prototype.errors = function(doc, resourceName){
  var properties = _.keys(doc);

  var errors = []
  errors = _.union(errors, this.getMissingAttributes(this.validation.required, properties))
  if (this.validation.optional !== true){
    errors = _.union(errors, this.getUnexpectedAttributes(this.validation.optional, this.validation.required, properties))
  }
  errors = _.union(errors, this.getInvalidAttributes(doc))

  return errors;
};

Muster.prototype.check = function(doc){
  var error = this.error(doc)
  if (error !== false){
    throw error;
  }
}
Muster.prototype.checkAll = function(doc){
  var errors = this.errors(doc)
  if (errors.length > 0){
    throw errors;
  }
}

Muster.prototype.error = function(doc){
  var properties = _.keys(doc);
  var errors = []
  errors = _.union(errors, this.getMissingAttributes(this.validation.required, properties))
  if (errors.length > 0){return errors[0];}

  if (this.validation.optional !== true){
    errors = _.union(errors, this.getUnexpectedAttributes(this.validation.optional, this.validation.required, properties))
  }
  if (errors.length > 0){return errors[0];}

  errors = _.union(errors, this.getInvalidAttributes(doc))
  if (errors.length > 0){return errors[0];}
  return false;
};

Muster.prototype.getMissingAttributes = function(requiredProperties, incomingProperties){
  var missings = _.difference(requiredProperties, incomingProperties);
  var errors = []
  _.each(missings, function(missing){
    var error = {
      "type": "MissingAttribute", 
      "message": "A key named '" + missing + "' is required but was not found.",
      "detail": missing
    }
    errors.push(error)
  });
  return errors;
}

Muster.prototype.getUnexpectedAttributes = function(optionalProperties, requiredProperties, incomingProperties){
  var allowedProperties = _.union(optionalProperties, requiredProperties);
  var extras = _.difference(incomingProperties, allowedProperties);
  var errors = []
  _.each(extras, function(extra){
   var error = {
    "type": "UnexpectedAttribute", 
    "message": "A key named '" + extra + "' was found but is not allowed.",
    "detail": extra 
    }
    return errors.push(error);
  });
  return errors;
}

Muster.prototype.getInvalidAttributes = function(doc){
  var validator = this;
  var errors = [];
  _.each(this.keyValidators, function(validator){
    var error = validator.error(doc[validator.keyname])
    if (error){
      errors.push(error);
    }
  });
  return errors;
}

var KeyValidator = function(muster, keyname){
  this.muster = muster;
  this.keyname = keyname;
  this.message = "Key " + this.keyname + " had an unknown attribute error";
  this.callback = function(){return true;}
}

KeyValidator.prototype.setValidator = function(message, cb){
    this.message = message;
    this.callback = cb;
  }

KeyValidator.prototype.error = function(val){
  if (!this.callback(val)){
    return {type : "InvalidAttribute",
            message : this.message,
            detail : val }
  }
  return false;
}

KeyValidator.prototype.mustMatch = function(regex){
  this.callback = function(val){
    return val.match(regex)
  }
  this.message = "Key '" + this.keyname + "' was not in the correct format.";
  this.muster.addKeyValidator(this)
  return this.muster;
}

KeyValidator.prototype.mustBeAnEmailAddress = function(){
  // VERY loose definition of email address to avoid false negatives as much as possible.
  this.callback = function(val){
    return val.match(/^[^\s]+@[^\s]+$/)
  }
  this.message = "Key '" + this.keyname + "' was not an email address.";
  this.muster.addKeyValidator(this)
  return this.muster;
}

KeyValidator.prototype.mustBeOneOf = function(list){
  this.callback = function(val){
    return _.include(list, val);
  }
  this.message = "Key '" + this.keyname + "' was not a valid value.";
  this.muster.addKeyValidator(this)
  return this.muster;
}

KeyValidator.prototype.mustEqual = function(expected){
  this.callback = function(val){
    return val == expected
  }
  this.message = "Key '" + this.keyname + "' was not the correct value.";
  this.muster.addKeyValidator(this)
  return this.muster;
}

KeyValidator.prototype.mustBeA = function(type){
  var typestring = (typeof type).toLowerCase();
  if (!!type.name) typestring = type.name.toLowerCase()
  if ((typestring == 'array') || (typestring == 'object')){  
    this.message = "Key '" + this.keyname + "' must be an " + typestring;
  } else {
    this.message = "Key '" + this.keyname + "' must be a " + typestring;
  }
  this.callback = function(val){
    if (typestring == "array"){
      return Object.prototype.toString.call(val) == '[object Array]' 
    }
    return (typeof val == typestring);
  }  
  this.muster.addKeyValidator(this)
  return this.muster;
}

KeyValidator.prototype.mustBeGreaterThan = function(gtVal){
  this.message = "Key '" + this.keyname + "' must be greater than " + gtVal;
  this.callback = function(val){return val > gtVal;}
  this.muster.addKeyValidator(this)
  return this.muster;
}
KeyValidator.prototype.mustBeLessThan = function(ltVal){
  this.message = "Key '" + this.keyname + "' must be less than " + ltVal;
  this.callback = function(val){return val < ltVal;}
  this.muster.addKeyValidator(this)
  return this.muster;
}

KeyValidator.prototype.mustPass = function(message, callback){
    this.setValidator(message, callback)
    this.muster.addKeyValidator(this)
    return this.muster;
}


exports.Muster = Muster;
