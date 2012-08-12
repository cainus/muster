var should = require('should');
var Muster = require('../muster');

describe('Muster', function(){ 

  beforeEach(function(done){
     done();
  });

  /*

  TODO:
  - jshint in ci
  - runnable in a browser

  */

  describe("#error", function(){
    it ("should return false if it doesn't have validations", function(){
      var m = (new Muster());
      var doc = { firstname : 'Gregg', 
                  lastname : 'Caines', 
                  birthyear : 1975,
                  isAwesome : true };
      m.error(doc).should.equal(false);
    });
  });
  
  describe("#check", function(){
    it ("should throw an exception if there is an error", function(){
      var m = (new Muster()).mustHaveKeys(["firstname", "lastname"]);
      try {
        m.check({"firstname" : "Joe"});
        should.fail("expected exception was not thrown");
      } catch (error) {
        error.type.should.equal('MissingAttribute');
        error.message.should.equal("A key named 'lastname' is required but was not found.");
        error.detail.should.equal('lastname');
      }
    });
    it ("should do nothing if there is no error", function(){
      var m = (new Muster()).mustHaveKeys(["firstname", "lastname"]);
      m.check({"firstname" : "Joe", "lastname" : "Strummer"});
    });
    it ("should not care about validations on fields that don't exist", function(){
      // mustHaveKeys() should be used to catch missing fields, not key validators
      var m = (new Muster()).key("NO_KEY").mustBeA(String).check({});
    });
  });
  describe("#checkAll", function(){
    it ("should throw an exception if there are any errors", function(){
      var m = (new Muster())
                .mustHaveKeys(["firstname", "lastname"]);
      try {
        m.checkAll({});
        should.fail("expected exception was not thrown");
      } catch (errors) {
        errors.length.should.equal(2);
        errors[0].type.should.equal('MissingAttribute');
        errors[0].message.should.equal("A key named 'firstname' is required but was not found.");
        errors[0].detail.should.equal('firstname');
        errors[1].type.should.equal('MissingAttribute');
        errors[1].message.should.equal("A key named 'lastname' is required but was not found.");
        errors[1].detail.should.equal('lastname');
      }
    });
    it ("should do nothing if there is no error", function(){
      var m = (new Muster()).mustHaveKeys(["firstname", "lastname"]);
      m.checkAll({"firstname" : "Joe", "lastname" : "Strummer"});
    });
  });

  describe("#errors", function(){
    it ("should return empty array if it doesn't have validations", function(){
      var m = (new Muster());
      var doc = { firstname : 'Gregg', 
                  lastname : 'Caines', 
                  birthyear : 1975,
                  isAwesome : true };
      JSON.stringify(m.errors(doc)).should.equal('[]');
    });
    it ("should return an array of multiple errors if it has multiple errors", function(){
      var m = (new Muster()).mustHaveKeys(["firstname", "lastname"]);
      var errors = m.errors({});
      errors[0].should.not.equal(false);
      errors[0].type.should.equal('MissingAttribute');
      errors[0].message.should.equal("A key named 'firstname' is required but was not found.");
      errors[0].detail.should.equal('firstname');
      errors[1].should.not.equal(false);
      errors[1].type.should.equal('MissingAttribute');
      errors[1].message.should.equal("A key named 'lastname' is required but was not found.");
      errors[1].detail.should.equal('lastname');
    });
  });

  describe("#mayHaveKeys", function(){
    // this method specifies keys that are optional, 
    // meaning they are allowed, but not necessary.
    // It also means that keys that are included in the object
    // beyond these and those specified in mustHaveKeys() are
    // not allowed, and will cause a validation error.
    it ("should return an error if extra keys exist", function(){
      var m = (new Muster()).mayHaveKeys(["firstname", "lastname"]);
      var doc = { firstname : 'Gregg', 
                  birthyear : 1975};
      var error = m.error(doc);
      error.should.not.equal(false);
      error.type.should.equal('UnexpectedAttribute');
      error.message.should.equal("A key named 'birthyear' was found but is not allowed.");
      error.detail.should.equal('birthyear');
  
    });
  });

  describe("#mustHaveKeys", function(){
    it ("should return an error if required keys are missing", function(){
      var m = (new Muster()).mustHaveKeys(["firstname", "lastname"]);
      var doc = { firstname : 'Gregg', 
                  birthyear : 1975};
      var error = m.error(doc);
      error.should.not.equal(false);
      error.type.should.equal('MissingAttribute');
      error.message.should.equal("A key named 'lastname' is required but was not found.");
      error.detail.should.equal('lastname');
    });
    it ("should not return an error if required keys are supplied", function(){
      var m = (new Muster()).mustHaveKeys(["firstname", "lastname"]);
      var doc = { firstname : 'Gregg', 
                  lastname : 'Caines',
                  birthyear : 1975};
      var error = m.error(doc);
      error.should.equal(false);
    });
  });

  describe("#mustPass with error()", function(){
    it ("should return an error if the given function fails", function(){
      var error = (new Muster()).mustPass("lastname must be 'Caines'", function(val){
          return val.lastname == 'Caines';
        })
      .error({"lastname" : "NotCaines"});
      error.should.not.equal(false);
      error.type.should.equal("InvalidDocument");
      error.message.should.equal("lastname must be 'Caines'");
      JSON.stringify(error.detail).should.equal('{"lastname":"NotCaines"}');
    });
    it ("should return false if the given function passes", function(){
      var error = (new Muster()).mustPass("lastname must be 'Caines'", function(val){
          return val.lastname == 'Caines';
        })
      .error({"lastname" : "Caines"});
      error.should.equal(false);
    });
  });
  describe("#mustPass with errors()", function(){
    it ("should return an array with an error if the given function fails", function(){
      var errors = (new Muster()).mustPass("lastname must be 'Caines'", function(val){
          return val.lastname == 'Caines';
        })
      .errors({"lastname" : "NotCaines"});
      errors[0].should.not.equal(false);
      errors[0].type.should.equal("InvalidDocument");
      errors[0].message.should.equal("lastname must be 'Caines'");
      JSON.stringify(errors[0].detail).should.equal('{"lastname":"NotCaines"}');
      errors.length.should.equal(1);
    });
    it ("should return an empty array if the given function passes", function(){
      var errors = (new Muster()).mustPass("lastname must be 'Caines'", function(val){
          return val.lastname == 'Caines';
        })
      .errors({"lastname" : "Caines"});
      JSON.stringify(errors).should.equal('[]');
    });
  });

  describe("#key().mustPass", function(){
    it ("should return an error if the given function fails", function(){
      var error = (new Muster())
        .key("lastname").mustPass("lastname must be 'Caines'", function(val){
          return val == 'Caines';
        })
      .error({"lastname" : "NotCaines"});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("lastname must be 'Caines'");
      error.detail.should.equal("NotCaines");
    });
    it ("should return false if the given function passes", function(){
      var error = (new Muster())
        .key("lastname").mustPass("lastname must be 'Caines'", function(val){
          return val == 'Caines';
        })
      .error({"lastname" : "Caines"});
      error.should.equal(false);
    });
  });

  describe("#mustPassMuster", function(){
    it ("should return an error if the given must object fails", function(){
      var nameMuster = (new Muster()).mustHaveKeys(["first", "middle", "last"]);
      var error = (new Muster())
        .key("name").mustPassMuster(nameMuster)
        .error({"name" : {"first" : "Gregg", "last" : "Caines"}});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Problem with key 'name': A key named 'middle' is required but was not found.");
      JSON.stringify(error.detail).should.equal('{"first":"Gregg","last":"Caines"}');
    });
    it ("should return false if the given muster object passes", function(){
      var nameMuster = (new Muster()).mustHaveKeys(["first", "middle", "last"]);
      var error = (new Muster())
        .key("name").mustPassMuster(nameMuster)
        .error({"name" : {"first" : "Gregg", "middle" : "pearson", "last" : "Caines"}});
      error.should.equal(false);
    });
  });

  describe("#mustBeGreaterThan", function(){
    it ("should return false if it's above the given number", function(){
      var error = (new Muster()).key("year").mustBeGreaterThan(2011).error({"year":2012});
      error.should.equal(false);
    });
    it ("should return an error if it's not above the given number", function(){
      var error = (new Muster()).key("year").mustBeGreaterThan(2011).error({"year":2010});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be greater than 2011");
      error.detail.should.equal(2010);
    });
  });
  describe("#mustBeLessThan", function(){
    it ("should return false if it's less than the given number", function(){
      var error = (new Muster()).key("year").mustBeLessThan(2011).error({"year":2010});
      error.should.equal(false);
    });
    it ("should return an error if it's not less than the given number", function(){
      var error = (new Muster()).key("year").mustBeLessThan(2011).error({"year":2012});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be less than 2011");
      error.detail.should.equal(2012);
    });
  });
  describe("#mustHaveLength", function(){
    it ("should return false if it has an expected matching length", function(){
      var error = (new Muster())
                    .key('somearr').mustHaveLength(4)
                    .error({"somearr":[1,2,3,4]});
      error.should.equal(false);
    });
    it ("should return false if the > criteria is successful for arrays", function(){
      var error = (new Muster())
                    .key('somearr').mustHaveLength('>', 3)
                    .error({"somearr":[1,2,3,4]});
      error.should.equal(false);
    });
    it ("should return false if the < criteria is successful for strings", function(){
      var error = (new Muster())
                    .key('somearr').mustHaveLength('<', 5)
                    .error({"somearr":'1234'});
      error.should.equal(false);
    });
    it ("should throw an error if the comparator is invalid", function(){
      try {
        var error = (new Muster())
                    .key('somearr').mustHaveLength('!', 5)
                    .error({"somearr":'1234'});
        should.fail("expected exception was not raised!");
      } catch (error){
        error.should.equal('Comparator for mustHaveLength() must be one of >, <, ==, >=, or <=.');
      }
    });
    it ("should return an error if it doesn't have a .length", function(){
      var error = (new Muster()).key("year").mustHaveLength(2).error({"year":2010});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must have a length equal to 2.");
      error.detail.should.equal(2010);
    });
    it ("should return an error if it fails to match expected length", function(){
      var error = (new Muster()).key("year").mustHaveLength(2).error({"year":'2010'});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must have a length equal to 2.");
      error.detail.should.equal('2010');
    });
    it ("should return an error if it fails to match > criteria for arrays", function(){
      var error = (new Muster()).key("somearr").mustHaveLength('>', 4).error({"somearr":[1,2,3,4]});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'somearr' must have a length greater than 4.");
      JSON.stringify(error.detail).should.equal('[1,2,3,4]');
    });
  });
  describe("#mustBeA", function(){
    it ("should return false if it's an object and should be", function(){
      var error = (new Muster()).key("year").mustBeA(Object).error({"year":{}});
      error.should.equal(false);
    });
    it ("should return false if it's an array and should be", function(){
      var error = (new Muster()).key("year").mustBeA(Array).error({"year":[]});
      error.should.equal(false);
    });
    it ("should return false if it's a string and should be", function(){
      var error = (new Muster()).key("year").mustBeA(String).error({"year":"someyear"});
      error.should.equal(false);
    });
    it ("should return false if it's a number and should be", function(){
      var error = (new Muster()).key("year").mustBeA(Number).error({"year":2010});
      error.should.equal(false);
    });
    it ("should return false if it's a boolean and should be", function(){
      var error = (new Muster())
                      .key("awesome").mustBeA(Boolean)
                      .key("terrible").mustBeA(Boolean)
                      .error({"awesome":true, "terrible" : false});
      error.should.equal(false);
    });
    it ("should return an error if it's not a boolean but should be", function(){
      var error = (new Muster()).key("awesome").mustBeA(Boolean).error({"awesome":1});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'awesome' must be a boolean");
      error.detail.should.equal(1);
    });

    it ("should return an error if it's not a number but should be", function(){
      var error = (new Muster()).key("year").mustBeA(Number).error({"year":"twenty"});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be a number");
      error.detail.should.equal("twenty");
    });
    it ("should return an error if it's not a string but should be", function(){
      var error = (new Muster()).key("year").mustBeA(String).error({"year":1234});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be a string");
      error.detail.should.equal(1234);
    });
    it ("should return an error if it's not an array but should be", function(){
      var error = (new Muster()).key("year").mustBeA(Array).error({"year":{}});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be an array");
      JSON.stringify(error.detail).should.equal('{}');
    });
    it ("should return an error if it's not an object but should be", function(){
      var error = (new Muster()).key("year").mustBeA(Object).error({"year":1234});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be an object");
      error.detail.should.equal(1234);
    });
  });
  describe("#mustBeADateString", function(){
    it ("should return false if it the values are equal", function(){
      var error = (new Muster())
                      .key("year").mustBeADateString()
                      .error({"somedate":'2009-10-16T20:11:36.456-07:00'});
      error.should.equal(false);
    });
    it ("should return an error if the values are not equal", function(){
      var error = (new Muster()).key("year").mustBeADateString().error({"year":'14'});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' must be a valid ISO8601/RFC3339 date string.");
      error.detail.should.equal('14');
    });
  });
  
  describe("#mustEqual", function(){
    it ("should return false if it the values are equal", function(){
      var error = (new Muster()).key("year").mustEqual('2010').error({"year":'2010'});
      error.should.equal(false);
    });
    it ("should return an error if the values are not equal", function(){
      var error = (new Muster()).key("year").mustEqual('2011').error({"year":'2010'});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' was not the correct value.");
      error.detail.should.equal('2010');
    });
  });

  describe("#mustBeOneOf", function(){
    it ("should return false if it the values are equal", function(){
      var error = (new Muster()).key("year").mustBeOneOf(['2010', '2011', '2012']).error({"year":'2010'});
      error.should.equal(false);
    });
    it ("should return an error if the values are not equal", function(){
      var error = (new Muster()).key("year").mustBeOneOf(['2010', '2011', '2012']).error({"year":'2009'});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' was not a valid value.");
      error.detail.should.equal('2009');
    });
  });

  describe("#mustMatch", function(){
    it ("should return false if it matches the given regex", function(){
      var error = (new Muster()).key("year").mustMatch(/[0-9]{4}/).error({"year":'2010'});
      error.should.equal(false);
    });
    it ("should return an error if it doesn't match the given regex", function(){
      var error = (new Muster()).key("year").mustMatch(/^[0-9]{3}$/).error({"year":'2010'});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'year' was not in the correct format.");
      error.detail.should.equal('2010');
    });
    it ("should return an error if the input is non-string", function(){
      var error = (new Muster()).key("year").mustMatch(/^[0-9]{4}$/).error({"year":2010});
      error.should.equal(false);
    });
  
  });
  describe("#mustBeAnEmailAddress", function(){
    it ("should return false if it could be an email address", function(){
      var error = (new Muster())
          .key("emailaddress").mustBeAnEmailAddress().error({"emailaddress":'asdf@asdf.com'});
      error.should.equal(false);
    });
    it ("should return an error if it could not be an email address", function(){
      var error = (new Muster())
          .key("emailaddress").mustBeAnEmailAddress().error({"emailaddress":'2010'});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'emailaddress' was not an email address.");
      error.detail.should.equal('2010');
    });
  
  });
  describe("#getKeyValidatorPrototype", function(){
    it ("should allow the user to add her own must- criteria", function(){
      var validator = Muster.keyValidatorPrototype;
      // just add your own validations to the prototype
      validator.mustBeTheColour = function(colour){
        // the validation message...
        this.message = "Key '" + this.keyname + "' must be the colour " + colour + ".";
        this.callback = function(val){  // the validation function
          return val == colour; 
        };
        this.muster.addKeyValidator(this); // registers the key validator
        return this.muster;  // necessary for chaining
      };
      var error = (new Muster())
                    .key("colour").mustBeTheColour("blue")
                    .error({"colour" : "yellow"});
      error.should.not.equal(false);
      error.type.should.equal("InvalidAttribute");
      error.message.should.equal("Key 'colour' must be the colour blue.");
      error.detail.should.equal('yellow');
      error = (new Muster())
                    .key("colour").mustBeTheColour("yellow")
                    .error({"colour" : "yellow"});
      error.should.equal(false);
    });
  });

});
