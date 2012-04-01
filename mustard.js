const _ = require('underscore')

var Mustard = function(){
  this.validation = {required : [], optional : true}
  this.fieldValidators = {}
  this.keyValidators = []
  this.mode = "validatable"
  this.pendingKey = null;
}

Mustard.prototype.key = function(keyname){
  this.pendingKey = keyname;
  return new KeyValidator(this, keyname);
}


Mustard.prototype.addKeyValidator = function(kv){
  this.keyValidators.push(kv);
}

Mustard.prototype.mustHaveKeys = function(fields){
  this.validation.required = fields;
  return this;
}

Mustard.prototype.mayHaveKeys = function(fields){
  this.validation.optional = fields;
  return this;
}

Mustard.prototype.expectField = function(fieldname){
  var expectation = {}
  return expectation;
}

Mustard.prototype.addFieldValidator = function(fieldName, validator, message){
  this.fieldValidators[fieldName] = {"validator" : validator, "message" : message}
}

Mustard.prototype.error = function(doc, resourceName){
  if (!this.validation){return true;}
  var properties = _.keys(doc);

  var errors = []
  errors = _.union(errors, this.getMissingAttributes(this.validation.required, properties, resourceName))
  if (this.validation.optional !== true){
    errors = _.union(errors, this.getUnexpectedAttributes(this.validation.optional, this.validation.required, properties, resourceName))
  }
  errors = _.union(errors, this.getInvalidAttributes(doc, resourceName))

  if (errors.length > 0){return errors[0];}
  if (this.validation.docValidator) {
    return this.validation.docValidator(doc);
  } else {
    return false;
  }
};

Mustard.prototype.getMissingAttributes = function(requiredProperties, incomingProperties, resourceName){
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

Mustard.prototype.getUnexpectedAttributes = function(optionalProperties, requiredProperties, incomingProperties, resourceName){
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

Mustard.prototype.getInvalidAttributes = function(doc, resourceName){
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

var KeyValidator = function(mustard, keyname){
  this.mustard = mustard;
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
  this.mustard.addKeyValidator(this)
  return this.mustard;
}

KeyValidator.prototype.mustEqual = function(expected){
  this.callback = function(val){
    return val == expected
  }
  this.message = "Key '" + this.keyname + "' was not the correct value.";
  this.mustard.addKeyValidator(this)
  return this.mustard;
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
  this.mustard.addKeyValidator(this)
  return this.mustard;
}

KeyValidator.prototype.mustBeGreaterThan = function(gtVal){
  this.message = "Key '" + this.keyname + "' must be greater than " + gtVal;
  this.callback = function(val){return val > gtVal;}
  this.mustard.addKeyValidator(this)
  return this.mustard;
}
KeyValidator.prototype.mustBeLessThan = function(ltVal){
  this.message = "Key '" + this.keyname + "' must be less than " + ltVal;
  this.callback = function(val){return val < ltVal;}
  this.mustard.addKeyValidator(this)
  return this.mustard;
}

KeyValidator.prototype.mustPass = function(message, callback){
    this.setValidator(message, callback)
    this.mustard.addKeyValidator(this)
    return this.mustard;
}


exports.Mustard = Mustard;
