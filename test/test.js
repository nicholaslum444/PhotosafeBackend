var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server.js');
var fs = require('fs');
var should = chai.should();
var expect = chai.expect;

TEST_AUTH_TOKEN = "foo";

chai.use(chaiHttp);

describe("Blacklist tests", function(done) {
    it("Retrieves keys in blacklist, should be [1,2,3]", function(done) {
        chai.request(server.app)
        .get("/blacklist/keys")
        .query({auth_token: TEST_AUTH_TOKEN})
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
        });
    });
    
    it("Retrieves image file with key 1", function(done) {
        chai.request(server.app)
        .get("/blacklist/img")
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 1})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.be.an.instanceOf(Buffer);
            // TODO implement image comparision
            done();
        });
    });
    
    // obama at ohio
    it("Adds an image url to the blacklist, will be key 4", function(done) {
        this.timeout(10000);
        setTimeout(done, 10000);
        chai.request(server.app)
        .post("/blacklist/add/url")
        .query({auth_token: TEST_AUTH_TOKEN})
        .send("image_url=http://i2.cdn.turner.com/cnn/2012/images/06/13/2ohio.jpg")
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
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 4})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.be.an.instanceOf(Buffer);
            var imageKey4Compare = fs.createWriteStream("test/image-key-4-comp.jpg");
            imageKey4Compare.write(response.body);
            imageKey4Compare.end();
            imageKey4Compare.on("finish", function() {
                // retrieved image downloaded and saved.
                // manually compare the images in the test folder. 
                done();
            });
        });
    });
    
    it("Removes the new image file with key 4", function(done) {
        chai.request(server.app)
        .post("/blacklist/img/delete")
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 4})
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
        });
    });
    
    it("Adds an image file to the blacklist, will be key 5", function(done) {
        this.timeout(10000);
        setTimeout(done, 10000);
        chai.request(server.app)
        .post("/blacklist/add/img")
        .query({auth_token: TEST_AUTH_TOKEN})
        .attach('image_file', fs.readFileSync('test/image-key-5-large.jpg'), 'image-key-5-large.jpg')
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            response.body.data.image_key.should.equal(5);
            done();
        });
    });
    
    it("Retrieves the new image file with key 5", function(done) {
        chai.request(server.app)
        .get("/blacklist/img")
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 5})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            response.should.have.status(200);
            response.body.should.be.an.instanceOf(Buffer);
            var imageKey5Compare = fs.createWriteStream("test/image-key-5-comp.jpg");
            imageKey5Compare.write(response.body);
            imageKey5Compare.end();
            imageKey5Compare.on("finish", function() {
                // retrieved image downloaded and saved.
                // manually compare the images in the test folder. 
                done();
            });
        });
    });
    
    // compare poster.jpg with http://i.imgur.com/CQVy6Gz.jpg
    it("Compares image url to the blacklist, should match poster.jpg image key 2", function(done) {
        this.timeout(10000);
        setTimeout(done, 10000);
        chai.request(server.app)
        .post("/compare")
        .query({auth_token: TEST_AUTH_TOKEN})
        .send("image_url=http://i.imgur.com/CQVy6Gz.jpg")
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            console.log(response.body);
            response.body.data[1].image_key.should.equal(2);
            response.body.data[1].similarity.should.be.at.least(0.95);
            done();
        });
    });
    
    // compare http://i2.cdn.turner.com/cnn/2012/images/06/13/2ohio.jpg nothing matches
    it("Compares image url to the blacklist, should match poster.jpg image key 2", function(done) {
        this.timeout(10000);
        setTimeout(done, 10000);
        chai.request(server.app)
        .post("/compare")
        .query({auth_token: TEST_AUTH_TOKEN})
        .send("image_url=http://i2.cdn.turner.com/cnn/2012/images/06/13/2ohio.jpg")
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            console.log(response.body);
            // response.body.data[1].image_key.should.equal(2);
            // response.body.data[1].similarity.should.be.at.least(0.95);
            response.body.data.forEach(function(result) {
                result.similarity.should.be.below(0.95);
            }
            done();
        });
    });
});
