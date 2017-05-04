var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
var expect = chai.expect;

chai.use(chaiHttp);

describe("Blacklist tests", function(done) {
    it("Retrieves keys in blacklist, should be [1,2,3]", function(done) {
        chai.request(server.app)
        .get("/blacklist/keys")
        .query({auth_token: "foo"})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.have.status("success");
            // data should be [1,2,3]
            response.body.data.should.have.lengthOf(3);
            response.body.data[0].should.equal(1);
            response.body.data[1].should.equal(2);
            response.body.data[2].should.equal(3);
            done();
            return;
        });
    });
    
    it("Retrieves image file with key 1", function(done) {
        chai.request(server.app)
        .get("/blacklist/img")
        .query({auth_token: "foo", image_key: 1})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.be.an.instanceOf(Buffer);
            // TODO implement image comparision
            done();
            return
        });
    });
    
    it("Adds an image url to the blacklist, will be key 4", function(done) {
        this.timeout(10000);
        setTimeout(done, 10000);
        chai.request(server.app)
        .post("/blacklist/add/url")
        .query({auth_token: "foo"})
        .send({image_url: "https://lh6.googleusercontent.com/-2lJYGtfXKwQ/AAAAAAAAAAI/AAAAAAAB2HQ/QSmIw0nQN_c/photo.jpg"})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            response.body.data.image_key.should.equal(4);
            done();
        });
    });
    
    it("Retrieves the new image file with key 4", function(done) {
        chai.request(server.app)
        .get("/blacklist/img")
        .query({auth_token: "foo", image_key: 4})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.be.an.instanceOf(Buffer);
            // TODO implement image comparision
            done();
            return
        });
    });
    
    it("Removes the new image file with key 4", function(done) {
        chai.request(server.app)
        .post("/blacklist/img/delete")
        .query({auth_token: "foo", image_key: 4})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.have.status("success");
            response.body.data.should.equal("4");
            // response.body.should.be.an.instanceOf(Buffer);
            done();
            return
        });
    });
});
