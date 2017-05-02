var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var should = chai.should();
var expect = chai.expect;

chai.use(chaiHttp);

describe("Blacklist tests", function(done) {
    it("Gets keys in blacklist", function(done) {
        chai.request(server.app)
        .get("/blacklist/keys")
        .query({auth_token: "foo"})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.should.have.property("body");
            response.body.should.have.status("success");
            // we only test for presence of data since we don't
            // have a fixed testing database yet
            response.body.should.have.property("data");
            response.body.data.should.be.an.instanceOf(Array);
            done();
            return;
        });
    });
    
    it("Gets image file with key 9", function(done) {
        chai.request(server.app)
        .get("/blacklist/img")
        .query({auth_token: "foo", image_key: 9})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.should.have.property("body");
            response.body.should.be.an.instanceOf(Buffer);
            // we only test for presence of buffer since we don't
            // have a fixed testing database yet
            // However we assume item 9 exists, which is stupid and 
            // should be resolved
            done();
            return
        });
    });
    
    it("uploads an image url to the blacklist", function(done) {
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
            response.should.have.property("body");
            response.body.should.have.status("success");
            response.body.should.have.property("data");
            response.body.data.should.have.property("image_key");
            response.body.data.image_key.should.be.a('number');
            done();
        });
    });
});
