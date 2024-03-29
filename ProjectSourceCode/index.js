// *****************************************************
//                 <Import Dependencies>
// *****************************************************
const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.


// *****************************************************
//                 <App Settings>
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});


// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


// *****************************************************
//                 <Connect to DB>
// *****************************************************


// Database configuration
const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
  };
  
  const db = pgp(dbConfig);
  
// Test database
db.connect()
.then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
})
.catch(error => {
    console.log('ERROR:', error.message || error);
});
  


// *****************************************************
//                      <Routes>
// *****************************************************

// Re-Direct to Login as Default
app.get('/', (req, res) => {
  res.redirect('/login'); // Redirect to the /login route
});

// Route to render the login page
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// Route to render the registration page
app.get('/register', (req, res) => {
  res.render('pages/register');
});

// Route to render the explore page
app.get('/explore', (req, res) => {
  res.render('pages/explore');
});





// Handle user registration
app.post('/register', async (req, res) => {
  try {
      const hash = await bcrypt.hash(req.body.password, 10);
      await db.none('INSERT INTO users(username, password) VALUES($1, $2)', [req.body.username, hash]);
      res.redirect('/login');
  } catch (error) {
      console.error(error);
      console.log("REGISTER NOT WORKING")
      res.redirect('/register');
  }
});




// Route to handle user login
app.post('/login', async (req, res) => {
  try {
      // Find the user from the users table where the username is the same as the one entered by the user
      const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', req.body.username);

      // If the user is not found in the table, redirect to GET /register route
      if (!user) {
          return res.redirect('/register');
      }

      // Use bcrypt.compare to encrypt the password entered from the user and compare if the entered password is the same as the registered one
      const match = await bcrypt.compare(req.body.password, user.password);

      // If the password is incorrect, render the login page and send a message to the user stating "Incorrect username or password."
      if (!match) {
          return res.render('login', { message: 'Incorrect username or password.' });
      }

      // Save the user in the session variable
      req.session.user = user;
      req.session.save();

      // If the user is found, redirect to /discover route after setting the session
      res.redirect('/explore');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});




// *****************************************************
//                   <Start Server>
// *****************************************************
app.listen(3000);
console.log('Server is listening on port 3000');