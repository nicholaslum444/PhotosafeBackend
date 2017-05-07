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
            
            // write the file to disk for manual inspection
            saveFile(response, "test/image-key-1-comp.jpg", done);
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
            
            // write the file to disk for manual inspection
            saveFile(response, "test/image-key-4-comp.jpg", done);
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
            
            // write the file to disk for manual inspection
            saveFile(response, "test/image-key-5-comp.jpg", done);
        });
    });
    
    // compare poster.jpg with http://i.imgur.com/CQVy6Gz.jpg
    it("Compares image url to the blacklist, should match poster.jpg image 2", function(done) {
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
            response.body.data[1].image_key.should.equal(2);
            response.body.data[1].similarity.should.be.at.least(0.95);
            done();
        });
    });
    
    // compare http://i2.cdn.turner.com/cnn/2012/images/06/13/2ohio.jpg nothing matches
    it("Compares image url to the blacklist, should not match any", function(done) {
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
            response.body.data.forEach(function(result) {
                result.similarity.should.be.below(0.95);
            });
            done();
        });
    });
    
    it("Get image info for image 1", function(done) {
        chai.request(server.app)
        .get("/blacklist/img/info")
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 1})
        // .send({image_info:{image_keywords:["ball", "sports", "soccer", ]}})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            response.body.data.image_key.should.equal("1");
            response.body.data.image_keywords.should.have.lengthOf(2);
            response.body.data.image_keywords.should.contain("soccer");
            response.body.data.image_keywords.should.contain("sports");
            done();
        });
    });
    
    it("Change image info for image 1, adds ball and happy", function(done) {
        chai.request(server.app)
        .post("/blacklist/img/edit")
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 1})
        .send({image_info:{image_keywords:["ball", "sports", "soccer", "happy"]}})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            done();
        });
    });
    
    it("Get image info for image 1 again, with new keywords", function(done) {
        chai.request(server.app)
        .get("/blacklist/img/info")
        .query({auth_token: TEST_AUTH_TOKEN, image_key: 1})
        // .send({image_info:{image_keywords:["ball", "sports", "soccer", ]}})
        .end(function(error, response) {
            if (error) {
                done(error);
                return;
            }
            // console.log(response);
            response.should.have.status(200);
            response.body.should.have.status("success");
            response.body.data.image_key.should.equal("1");
            response.body.data.image_keywords.should.have.lengthOf(4);
            response.body.data.image_keywords.should.contain("soccer");
            response.body.data.image_keywords.should.contain("sports");
            response.body.data.image_keywords.should.contain("ball");
            response.body.data.image_keywords.should.contain("happy");
            done();
        });
    });
    
});

// writes file in response.body to disk
function saveFile(response, filename, done) {
    var file = fs.createWriteStream(filename);
    file.write(response.body);
    file.end();
    file.on("finish", function() {
        done();
    });
}
