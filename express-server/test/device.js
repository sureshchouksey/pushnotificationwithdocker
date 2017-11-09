//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
let mongoose = require("mongoose");
let Device = require('../models/device');
//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
chai.use(chaiHttp);

//Our parent block
describe('Device', () => {
	beforeEach((done) => { //Before each test we empty the database
		Device.remove({}, (err) => { 
		   done();		   
		});		
	});
 /*
  * Test the /GET route
  */
  describe('/GET device', () => {
	  it('it should GET all the devices', (done) => {
			chai.request(server)
		    .get('/device')
		    .end((err, res) => {
                console.log(err);
			  	res.should.have.status(200);
			  	res.body.should.be.a('array');
			  	res.body.length.should.be.eql(0);
		      done();
		    });
	  });
  });
 
 /*
  * Test the /GET/:id route
  */
   describe('/GET/:id device', () => {
 	  it('it should GET a device by the given id', (done) => {
 	  	let device = new Device({ userId: 1234,platform:"Android", apiKey: "1234",registrationToken: "1234", deviceId:1234 ,clientId: 1954,group:"fulcrum" });
 	  	device.save((err, device) => {
            
 	  		chai.request(server)
 		    .get('/device/' + device.userId + "/"+ device.deviceId)
 		    .send(device)
 		    .end((err, res) => {               
 			  	res.should.have.status(200);
 			  	res.body.should.be.a('object');
 			  	res.body.should.have.property('userId');
 			  	res.body.should.have.property('apiKey');
 			  	res.body.should.have.property('clientId');
 			  	res.body.should.have.property('registrationToken');
 			  	res.body.should.have.property('deviceId').eql(device.deviceId);
 		      done();
 		    });
 	  	});
			
 	  });
   });
 /*
  * Test the /PUT/:id route
  */
   describe('/PUT/:id device', () => {
 	  it('it should UPDATE a device given the id', (done) => {
 	  	let device = new Device({ userId: 12345,platform:"Android", apiKey: "1234",registrationToken: "1234", deviceId:12345 ,clientId: 1954,group:"fulcrum" });
 	  	device.save((err, device) => {
 				chai.request(server)
 			    .put('/device')
 			    .send({ userId: 12345,platform:"IOS", apiKey: "1234",registrationToken: "1234", deviceId:12345 ,clientId: 1950,group:"fulcrum" })
 			    .end((err, res) => {
 				  	res.should.have.status(200); 				  	
 			      done();
 			    });
 		  });
 	  });
   });
 /*
  * Test the /DELETE/:id route
  */
   describe('/DELETE/:id device', () => {
 	  it('it should DELETE a book given the id', (done) => {
 	  	let device = new Device({ userId: 4444,platform:"Android", apiKey: "1234",registrationToken: "1234", deviceId:5555 ,clientId: 1954,group:"fulcrum" })
 	  	device.save((err, device) => {
 				chai.request(server)
 			    .delete('/device/' + device.id)
 			    .end((err, res) => {
 				  	res.should.have.status(200);
 				  	res.body.should.be.a('object');
 				  	res.body.should.have.property('message').eql('Device successfully deleted!');
 				  	res.body.result.should.have.property('ok').eql(1);
 				  	res.body.result.should.have.property('n').eql(1);
 			      done();
 			    });
 		  });
 	  });
   });
});
  