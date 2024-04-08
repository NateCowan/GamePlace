// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

// describe('Server!', () => {
//   // Sample test case given to test / endpoint.
//   it('Returns the default welcome message', done => {
//     chai
//       .request(server)
//       .get('/welcome')
//       .end((err, res) => {
//         expect(res).to.have.status(200);
//         expect(res.body.status).to.equals('success');
//         assert.strictEqual(res.body.message, 'Welcome!');
//         done();
//       });
//   });
// });

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// ********************************************************************************

// COMMENT OUT ALL THE TEST CASES TO SEE THE WEBSITE IN THE BROWSER


// Test Cases for POST /register route
describe('Testing register API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'u3', password: 'password'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  it('Negative : /register -> Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'u11', password:'password'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });

});


// // Test Cases for POST /login route
describe('Testing login API', () => {
  it('positive : /login -> user found', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'testUser', password: 'password'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  it('Negative : /login -> user not found', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'userNotInDB', password:'password'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('User not found');
        done();
      });
  });

});

// describe('Testing Redirect', () => {
//   // Sample test case given to test /test endpoint.
//   it('\login route should redirect to /login with 302 HTTP status code', done => {
//     chai
//       .request(server)
//       .get('/login')
//       .end((err, res) => {
//         res.should.have.status(302); // Expecting a redirect status code
//         res.should.redirectTo(/^.*127\.0\.0\.1.*\/login$/); // Expecting a redirect to /login with the mentioned Regex
//         done();
//       });
//   });
// });

// describe('Testing Render', () => {
//   // Sample test case given to test /test endpoint.
//   it('test "/login" route should render with an html response', done => {
//     chai
//       .request(server)
//       .get('/login') // for reference, see lab 8's login route (/login) which renders home.hbs
//       .end((err, res) => {
//         res.should.have.status(200); // Expecting a success status code
//         res.should.be.html; // Expecting a HTML response
//         done();
//       });
//   });
// });