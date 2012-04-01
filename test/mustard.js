var should = require('should');
var Mustard = require('../mustard').Mustard;

describe('Mustard', function(){ 

  beforeEach(function(done){
     done();
  });

  /*

  GOALS:
  x make failed validations throw exceptions
  x exception should be a list of all failures
  x validate fields as well as document as a whole
  x make user-defined validations possible in case provided ones aren't enough
  x handle required, optional, and allow-all fields
  x don't dirty Object.prototype
  x don't pollute global namespace
  x check() throws first exception
  x checkAll() throws an array containing all errors as an exception
  x error() returns the first error
  x errors() returns all errors
  - custom validations should optionally take a callback in case they're asynch

  SECONDARY GOALS:
  - runnable in a browser
  - allow validation nesting
  x chainable?
  - extendable

  */

  describe("#error", function(){
    it ("should return false if it doesn't have validations", function(){
      var m = (new Mustard())
      var doc = { firstname : 'Gregg', 
                  lastname : 'Caines', 
                  birthyear : 1975,
                  isAwesome : true }
      m.error(doc).should.equal(false);
    })
  });
  
  describe("#check", function(){
    it ("should throw an exception if there is an error", function(){
      var m = (new Mustard()).mustHaveKeys(["firstname", "lastname"])
      try {
        m.check({"firstname" : "Joe"});
        should.fail("expected exception was not thrown")
      } catch (error) {
        error.type.should.equal('MissingAttribute');
        error.message.should.equal("A key named 'lastname' is required but was not found.");
        error.detail.should.equal('lastname');
      }
    });
    it ("should do nothing if there is no error", function(){
      var m = (new Mustard()).mustHaveKeys(["firstname", "lastname"])
      m.check({"firstname" : "Joe", "lastname" : "Strummer"});
    });
  });
  describe("#checkAll", function(){
    it ("should throw an exception if there are any errors", function(){
      var m = (new Mustard())
                .mustHaveKeys(["firstname", "lastname"])
      try {
        m.checkAll({});
        should.fail("expected exception was not thrown")
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
      var m = (new Mustard()).mustHaveKeys(["firstname", "lastname"])
      m.checkAll({"firstname" : "Joe", "lastname" : "Strummer"});
    });
  });

  describe("#errors", function(){
    it ("should return empty array if it doesn't have validations", function(){
      var m = (new Mustard())
      var doc = { firstname : 'Gregg', 
                  lastname : 'Caines', 
                  birthyear : 1975,
                  isAwesome : true }
      JSON.stringify(m.errors(doc)).should.equal('[]');
    })
    it ("should return an array of multiple errors if it has multiple errors", function(){
      var m = (new Mustard()).mustHaveKeys(["firstname", "lastname"])
      var errors = m.errors({});
      errors[0].should.not.equal(false)
      errors[0].type.should.equal('MissingAttribute');
      errors[0].message.should.equal("A key named 'firstname' is required but was not found.");
      errors[0].detail.should.equal('firstname');
      errors[1].should.not.equal(false)
      errors[1].type.should.equal('MissingAttribute');
      errors[1].message.should.equal("A key named 'lastname' is required but was not found.");
      errors[1].detail.should.equal('lastname');
    })
  });

  describe("#mayHaveKeys", function(){
    // this method specifies keys that are optional, 
    // meaning they are allowed, but not necessary.
    // It also means that keys that are included in the object
    // beyond these and those specified in mustHaveKeys() are
    // not allowed, and will cause a validation error.
    it ("should return an error if extra keys exist", function(){
      var m = (new Mustard()).mayHaveKeys(["firstname", "lastname"])
      var doc = { firstname : 'Gregg', 
                  birthyear : 1975}
      var error = m.error(doc);
      error.should.not.equal(false)
      error.type.should.equal('UnexpectedAttribute');
      error.message.should.equal("A key named 'birthyear' was found but is not allowed.");
      error.detail.should.equal('birthyear');
  
    });
  });

  describe("#mustHaveKeys", function(){
    it ("should return an error if required keys are missing", function(){
      var m = (new Mustard()).mustHaveKeys(["firstname", "lastname"])
      var doc = { firstname : 'Gregg', 
                  birthyear : 1975}
      var error = m.error(doc);
      error.should.not.equal(false)
      error.type.should.equal('MissingAttribute');
      error.message.should.equal("A key named 'lastname' is required but was not found.");
      error.detail.should.equal('lastname');
    })
    it ("should not return an error if required keys are supplied", function(){
      var m = (new Mustard()).mustHaveKeys(["firstname", "lastname"])
      var doc = { firstname : 'Gregg', 
                  lastname : 'Caines',
                  birthyear : 1975}
      var error = m.error(doc);
      error.should.equal(false)
    })
  });

  describe("#mustPass", function(){
    it ("should return an error if the given function fails", function(){
      var error = (new Mustard())
        .key("lastname").mustPass("lastname must be 'Caines'", function(val){
          return val == 'Caines';
        })
      .error({"lastname" : "NotCaines"});
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("lastname must be 'Caines'")
      error.detail.should.equal("NotCaines")
    })
    it ("should return false if the given function passes", function(){
      var error = (new Mustard())
        .key("lastname").mustPass("lastname must be 'Caines'", function(val){
          return val == 'Caines';
        })
      .error({"lastname" : "Caines"});
      error.should.equal(false)
    })
  });


  describe("#mustBeGreaterThan", function(){
    it ("should return false if it's above the given number", function(){
      var error = (new Mustard()).key("year").mustBeGreaterThan(2011).error({"year":2012})
      error.should.equal(false)
    });
    it ("should return an error if it's not above the given number", function(){
      var error = (new Mustard()).key("year").mustBeGreaterThan(2011).error({"year":2010})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' must be greater than 2011")
      error.detail.should.equal(2010)
    });
  });
  describe("#mustBeLessThan", function(){
    it ("should return false if it's less than the given number", function(){
      var error = (new Mustard()).key("year").mustBeLessThan(2011).error({"year":2010})
      error.should.equal(false)
    });
    it ("should return an error if it's not less than the given number", function(){
      var error = (new Mustard()).key("year").mustBeLessThan(2011).error({"year":2012})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' must be less than 2011")
      error.detail.should.equal(2012)
    });
  });
  describe("#mustBeA", function(){
    it ("should return false if it's an object and should be", function(){
      var error = (new Mustard()).key("year").mustBeA(Object).error({"year":{}})
      error.should.equal(false)
    });
    it ("should return false if it's an array and should be", function(){
      var error = (new Mustard()).key("year").mustBeA(Array).error({"year":[]})
      error.should.equal(false)
    });
    it ("should return false if it's a string and should be", function(){
      var error = (new Mustard()).key("year").mustBeA(String).error({"year":"someyear"})
      error.should.equal(false)
    });
    it ("should return false if it's a number and should be", function(){
      var error = (new Mustard()).key("year").mustBeA(Number).error({"year":2010})
      error.should.equal(false)
    });

    it ("should return an error if it's not a number but should be", function(){
      var error = (new Mustard()).key("year").mustBeA(Number).error({"year":"twenty"})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' must be a number")
      error.detail.should.equal("twenty")
    });
    it ("should return an error if it's not a string but should be", function(){
      var error = (new Mustard()).key("year").mustBeA(String).error({"year":1234})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' must be a string")
      error.detail.should.equal(1234)
    });
    it ("should return an error if it's not an array but should be", function(){
      var error = (new Mustard()).key("year").mustBeA(Array).error({"year":{}})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' must be an array")
      JSON.stringify(error.detail).should.equal('{}')
    });
    it ("should return an error if it's not an object but should be", function(){
      var error = (new Mustard()).key("year").mustBeA(Object).error({"year":1234})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' must be an object")
      error.detail.should.equal(1234)
    });
  });
  
  describe("#mustEqual", function(){
    it ("should return false if it the values are equal", function(){
      var error = (new Mustard()).key("year").mustEqual('2010').error({"year":'2010'})
      error.should.equal(false)
    });
    it ("should return an error if the values are not equal", function(){
      var error = (new Mustard()).key("year").mustEqual('2011').error({"year":'2010'})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' was not the correct value.")
      error.detail.should.equal('2010')
    });
  });

  describe("#mustMatch", function(){
    it ("should return false if it matches the given regex", function(){
      var error = (new Mustard()).key("year").mustMatch(/[0-9]{4}/).error({"year":'2010'})
      error.should.equal(false)
    });
    it ("should return an error if it doesn't match the given regex", function(){
      var error = (new Mustard()).key("year").mustMatch(/^[0-9]{3}$/).error({"year":'2010'})
      error.should.not.equal(false)
      error.type.should.equal("InvalidAttribute")
      error.message.should.equal("Key 'year' was not in the correct format.")
      error.detail.should.equal('2010')
    });
  
  });

})
