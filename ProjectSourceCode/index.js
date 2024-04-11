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

// Default Route for Test Case
// app.get('/welcome', (req, res) => {
//   res.json({status: 'success', message: 'Welcome!'});
// });

// ******************
//   Page Rendering
// ******************

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

// Route to render the game page
app.get('/game', (req, res) => {
  res.render('pages/game');
});

// Route to render the explore page
app.get('/explore', (req, res) => {
  res.render('pages/explore');
});

// ********************
//  Registration/Login
// ********************

// Handle user registration
app.post('/register', async (req, res) => {
  try {
      const hash = await bcrypt.hash(req.body.password, 10);
      await db.none('INSERT INTO users(username, password) VALUES($1, $2)', [req.body.username, hash]);
      
      // Need status codes for test cases 
      // res.status(200).json({
      //   message: 'Success'
      // });

      res.redirect('/login');
  } catch (error) {
      // Causes an error message with the test cases
      console.error(error);
      console.log("REGISTER NOT WORKING")

      // Need status codes for test cases
      // res.status(400).json({
      //   message: 'Invalid input'
      // });

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
        // res.status(400).send({message: 'User not found'});
        return res.render('pages/login', { message: 'Incorrect username or password.' });
      }

      // Use bcrypt.compare to encrypt the password entered from the user and compare if the entered password is the same as the registered one
      const match = await bcrypt.compare(req.body.password, user.password);

      // If the password is correct, redirect to explore page.
      if (match)
      {
        // Save the user in the session variable
        req.session.user = user;
        req.session.save();

        res.redirect('/explore');

        // res.status(200).json({
        //   message: 'Success'
        // });
      }
      // If password is incorrect, reload page and send message to user
      else {
        res.render('pages/login', { message: 'Incorrect username or password.' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);




// ROUTES WE WANT TO DISPLAY AFTER LOGING-IN SHOULD GO AFTER THE MIDDLEWARE
// **********
//   Search
// **********

//Route to search and send results
app.post('/search', (req, res) => {
  // .toLowerCase();
  // For now, its case sensitive
  const searchStr = req.body.search;
  var query = `SELECT * FROM game_data WHERE name = $1;`;

  db.query(query,[searchStr])
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log(err);
  });
// figure out how to render results with the returned data
});

//Filter by genre dropdown and send results
app.post('/filter', (req, res) => {
  var query = `SELECT * FROM game_data 
  JOIN game_to_genres ON game_data.game_id = game_to_genres.game_id
  JOIN game_genres ON game_to_genres.genre_id = game_genres.genre_id
  WHERE game_genres.genre = $1`;

  db.query(query,[req.body.filter.value])
  .then(data => {
    console.log(req.body.filter.value);
    console.log(data);
  })
  .catch(err => {
    console.log(err);
  });

});


//Route to render selected game page

//The below script will render the game html when called
/* app.get('/game', (req,res) => {
  res.render('pages/game', {
    game_title: title,
    cover:cover,
    artworks:artworks,
    summary:summary,
    genre:genre,
    platform:platform,
    developers:developers,
    date:date,
    rating:rating,
    username:username,
    reviews:reviews
  }) //Need to change these values to be the values of the selected game
}); */

//Route to add reviews for games
app.post('/game', (req,res) => {
  const query =
  `insert into reviews (username, review_text, rating, game_title) values ('${req.body.username}', '${req.body.review}','${req.body.rating}',${req.body.game_title})  returning *;`;


}); 

// Route to handle user logout 
app.get('/logout', (req, res) => {
  req.session.destroy(); //destroy user session variables 

  //redirect to the login page
  res.redirect('pages/login');
});


// *****************************************************
//                   <Start Server>
// *****************************************************
// app.listen(3000);
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');