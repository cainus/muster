# muster
[![Build
Status](https://secure.travis-ci.org/cainus/muster.png?branch=master)](http://travis-ci.org/cainus/muster)

muster is a library for quickly and easily validating javascript objects.  It is especially designed for JSON API input validation, but is acceptable as a more general-purpose solution as well.
muster does not pollute native prototypes or the global namespace.

## Example usage:

### Specifying required and optional fields
```javascript
var muster = require('muster');
var m = (new muster())
    .mustHaveKeys(["firstname", "lastname"])
    .mayHaveKeys(["emailaddress"])
var doc = { firstname : 'Joe', lastname : 'Strummer'}
var error = m.error(doc)
if (error){
  console.log(error);
} else {
  console.log("valid!");
}
// outputs "valid!"
```

### The anatomy of an error object:
```javascript
var muster = require('muster');
var m = (new muster())
            .mustHaveKeys(["firstname", "lastname"])
var doc = { firstname : 'Joe'}
var error = m.error(doc);
console.log(error);
// outputs:  { type: 'MissingAttribute',
//             message: 'A key named \'lastname\' is required but was not found.',
//             detail: 'lastname' }
// notice that they all have type, message, and detail fields.
```

### Key Validators (for validating individual keys of an object):
```javascript
var muster = require('muster');
var m = (new muster())
            .mustHaveKeys(["firstname", "lastname"])
            .key("firstname").mustMatch(/^[A-Za-z\- ]+$/)
console.log(m.error({ firstname : 'Joe', lastname : 'Strummer'}));
console.log(m.error({ firstname : 'Johnny5', lastname : 'The Robot'}));
// outputs:
// false
// { type: 'InvalidAttribute',
//   message: 'Key \'firstname\' was not in the correct format.',
//   detail: 'Johnny5' }
```

## Key Validators Examples:
### mustBeA
```javascript
var m = (new muster()).key("year").mustBeA(Number)  // can match Number, String, Boolean, or Array
console.log(m.error({ year : 2011 }));
```
### mustBeLessThan
```javascript
var m = (new muster()).key("year").mustBeLessThan(2012)
console.log(m.error({ year : 2011 }));
```
### mustBeGreaterThan
```javascript
var m = (new muster()).key("year").mustBeGreaterThan(2010)
console.log(m.error({ year : 2011 }));
```
### mustHaveLength
```javascript
// for strings and arrays
var m = (new muster())
            .key("year").mustHaveLength(4)
            .key("letters").mustHaveLength(">", 2)
            .key("letters").mustHaveLength("<", 3)
            .key("letters").mustHaveLength("<=", 4)
console.log(m.error({ year : '2011', letters : ['a', 'b', 'c', 'd'] }));

```
### mustEqual
```javascript
var m = (new muster()).key("year").mustEqual(2011)
console.log(m.error({ year : 2011 }));
```
### mustMatch
```javascript
var m = (new muster()).key("year").mustMatch(/^[0-9]{4}$/)
console.log(m.error({ year : '2011' }));
```
### mustBeOneOf  
```javascript
// for enumerations
var m = (new muster()).key("year").mustBeOneOf([2011, 2010, 2009])
console.log(m.error({ year : 2011 }));
```
### mustBeAnEmailAddress  
```javascript
// VERY loose acceptance, to avoid false-negatives
var m = (new muster()).key("emailaddress").mustBeAnEmailAddress()
console.log(m.error({ emailaddress : "asdf@asdf.com" }));
```
### mustBeADateString  
```javascript
// determine if it's a RFC3339 / ISO 1806 datestring 
var m = (new muster()).key("created").mustBeADateString()
console.log(m.error({ created : "2009-10-16T20:11:36.456-07:00" }));
```
### mustPass  
```javascript
// for user-defined matchers
var m = (new muster()).key("year").mustPass("Year must be 2011", function(value){return value == 2011})
console.log(m.error({ year : 2011 }));
```
### mustPassMuster  
```javascript
// takes a muster object for sub-objects.
var nameMuster = (new Muster()).mustHaveKeys(["first", "middle", "last"])
var m = (new Muster())
        .key("name").mustPassMuster(nameMuster)
console.log(m.error({"name" : {"first" : "Gregg", "middle" : "pearson", "last" : "Caines"}}));
```

## Chaining Validators:
Validators can be chained.

```javascript
  var muster = require('muster');
  var m = (new muster())
              .mustHaveKeys(["firstname", "lastname"])
              .mayHaveKeys("birthyear")
              .key("firstname").mustMatch(/^[A-Za-z\- ]+$/)
              .key("lastname").mustMatch(/^[A-Za-z\- ]+$/)
  console.log(m.error({ firstname : 'Joe', lastname : 'Strummer'}));

```

## Alternative ways to get errors
### errors()
The errors() method will return all errors, rather than just the first one.

```javascript
  var muster = require('muster');
  var m = (new muster())
              .mustHaveKeys(["firstname", "lastname"])
              .mayHaveKeys("birthyear")
              .key("firstname").mustMatch(/^[A-Za-z\- ]+$/)
              .key("lastname").mustMatch(/^[A-Za-z\- ]+$/)
  console.log(m.errors({ firstname : 'Joe', lastname : 'Strummer'}).length);
  // output:   0

```


### check()
The check() method will throw the error as an exception, rather than returning it.

```javascript
  var muster = require('muster');
  var m = (new muster())
              .mustHaveKeys(["firstname", "lastname"])
              .mayHaveKeys("birthyear")
              .key("firstname").mustMatch(/^[A-Za-z\- ]+$/)
              .key("lastname").mustMatch(/^[A-Za-z\- ]+$/)
  try {
    m.check({ firstname : 'Joe', lastname : 'Strummer'}));
    console.log("success!")
  } catch (error){
    console.log(error)  
  }
  // output: success!
```


### checkAll()
The checkAll() method will throw all errors in array as an exception, rather than returning it.

```javascript
  var muster = require('muster');
  var m = (new muster())
              .mustHaveKeys(["firstname", "lastname"])
              .mayHaveKeys("birthyear")
              .key("firstname").mustMatch(/^[A-Za-z\- ]+$/)
              .key("lastname").mustMatch(/^[A-Za-z\- ]+$/)
  try {
    m.checkAll({ firstname : 'Joe', lastname : 'Strummer'}));
    console.log("success!")
  } catch (errors){
    console.log("There were " + errors.length + " errors")
    console.log(errors)  
  }
  // output: success!
```
## Think muster is missing an obvious validator?  
I'd love to hear suggestions or get pull requests, but in the meantime you can still add it to the keyvalidator prototype at runtime...

```javascript

  var muster = require('muster');
  var validator = muster.keyValidatorPrototype;
      // just add your own validations to the prototype
      validator.mustBeTheColour = function(colour){
        // the validation message...
        this.message = "Key '" + this.keyname + "' must be the colour " + colour + ".";
        this.callback = function(val){  // the validation function
          return val == colour; 
        };
        this.muster.addKeyValidator(this) // registers the key validator
        return this.muster;  // necessary for chaining
      }
      var error = (new Muster())
                    .key("colour").mustBeTheColour("blue")
                    .error({"colour" : "blue"})  

```


