var app = require("../src/main.js");
var supertest = require("supertest")(app);
var should = require('should');

describe( "basic tests", function() {
    this.timeout(35000);

    before(function(done) {
            setTimeout(done,25000);
    });

    it("Responds with 'html'", function(done) {
        supertest
            .get("/")
            .buffer(true)
            .end((err,res)=>{
                    res.status.should.equal(200);
                    res.text.should.match(/<title>Databox<\/title>/);
                    done();
                });
    });
});