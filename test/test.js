var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
var expect = chai.expect;

chai.use(chaiHttp);

describe("Blacklist tests", function() {
    it("Get keys in blacklist", function() {
        chai.request(server.app)
            .get("/blacklist/keys")
            .end(function(error, response) {
                response.should.have.status(200);
                done();
            });
    });
    
    it("Get keys in blacklist", function() {
        chai.request(server.app)
        .get("/blacklist/keys")
        .end(function(error, response) {
            response.should.have.status(200);
            done();
        });
    });
});

// var assert = require('assert');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
    //   assert.equal(-1, [1,2,3].indexOf(4));
        expect([1,2,3].indexOf(4)).to.equal(-1);
    });
  });
});
