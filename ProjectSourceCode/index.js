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

// app.use(express.static(path.join(__dirname,'resources')));

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

// Route to render the explore page
app.get('/explore', (req, res) => {
  res.render('pages/explore');
});


app.get('/account', (req, res) => {
  if (req.session.user) { 
    const firstInitial = req.session.user.username.charAt(0).toUpperCase();
    res.render('pages/account', { username: req.session.user.username, firstInitial: firstInitial });
  } else {
    
    res.redirect('/login');
  }
});


// ********************
//  Registration/Login
// ********************

// Handle user registration
app.post('/register', async (req, res) => {
  try {
      // Check if the username already exists
      const existingUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);
      if (existingUser) {
        // Username already exists, send an error
        // return res.status(400).json({ message: 'Username already exists' });
        return res.render('pages/register', { message: 'User already exists.' });
      }

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

      res.redirect('/register',{message: err.message});
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
  if (!req.session.user ) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth); //RECOMMENT THIS LINE




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
  console.log(req.body.genre);

  var query = `SELECT * FROM game_data 
  JOIN game_to_genres ON game_data.game_id = game_to_genres.game_id
  JOIN game_genres ON game_to_genres.genre_id = game_genres.genre_id
  WHERE game_genres.genre = $1`;

  db.query(query,[req.body.genre])
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log(err);
  });

  res.json({message: 'End of route'});
});


//Route to add reviews for games
app.post('/game', async (req, res) => {
  try {
    const query =
      `insert into reviews (username, review_text, rating, game_title) values ($1, $2, $3, $4)  returning *;`;
    const data = await db.task('get-everything', task => {
      return task.batch([task.any(query, [
        req.body.username,
        req.body.review_text,
        req.body.rating,
        req.body.game_title,
      ])]);
    });

    // Fetch game data
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      body: `fields name,cover.*,artworks.*,summary,genres.*,platforms.*,involved_companies.company.*,screenshots.*,first_release_date; where name = "${req.body.game_title}";`
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data from IGDB');
    }

    const rawData = await response.json();
    console.log(rawData); // Log the game data
    const gameData = rawData[0];
    // Fetch reviews and rating
    let reviews = [];
    let rating = 0;
    try {
      reviews = await db.query(`SELECT * FROM reviews WHERE game_title = '${req.body.game_title}'`);
      rating = await db.query(`SELECT ROUND(AVG(rating),2) FROM reviews WHERE game_title = '${req.body.game_title}'`);
    } catch (error) {
      console.error("Error fetching review data:", error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    // Render the game page with data
    res.render('pages/game', {
      game_title: gameData.name,
      cover: gameData.cover.url,
      artworks: gameData.artworks,
      summary: gameData.summary,
      genre: gameData.genres,
      platform: gameData.platforms,
      developers: gameData.involved_companies.map(company => company.company.name),
      date: new Date(gameData.first_release_date * 1000).toDateString(),
      screenshots: gameData.screenshots,
      rating: rating[0].round,
      username: req.session.user.username,
      reviews: reviews,
      message: `Thank you for reviewing ${gameData.name}!`
    });
  } catch (error) {
    console.error("Error processing game data:", error);
    res.status(500).json({ error: 'Internal Server Error' });
    res.render('pages/register',{message:err.message})
  }
});


// Route to handle user logout 
app.get('/logout', (req, res) => {
  req.session.destroy(); //destroy user session variables 

  //redirect to the login page
  res.render('pages/login', { message: 'Logged out successfully.' });
});


//We may not need this endpoint? But it is a good prototype of what an endpoint with this api look like. 
// app.get('/get_genre', async (req, res) => {
//   try {
//     const response = await axios({
//       url: `https://api.igdb.com/v4/genres`,
//       method: `POST`,
//       dataType: `json`,
//       headers: {
//         'Accept': 'application/json',
//         'Client-ID': process.env.client_id,
//         'Authorization': process.env.access_token,
//       },
//       data: "fields checksum,created_at,name,slug,updated_at,url;"
//     });

//     // Send the JSON data back to the client
//     res.json(response.data);
//   } catch (err) {
//     console.error(err);
//     // Send an error response if something goes wrong
//     res.status(500).json({ error: 'Internal Server Error, Bearer ${process.env.access_token}' });
//   }
// });


//Route to render selected game page

app.get('/game', async (req, res) => {
  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      body: 'fields name,cover.*,artworks.*,summary,genres.*,platforms.*,involved_companies.company.*,screenshots.*,first_release_date; where name = "Halo 5: Guardians";'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from IGDB');
    }

    const data = await response.json();
    console.log(data); // Log the data
    
    let reviews = [];
    let rating = 0;

    try {
      reviews = await db.query(`SELECT * FROM reviews WHERE game_title = 'Halo 5: Guardians'`);
      rating = await db.query(`SELECT ROUND(AVG(rating),2) FROM reviews WHERE game_title = 'Halo 5: Guardians'`);
    }
    catch (error)
    {
      console.log('Failed to fetch data')
      rating = 0;
      reviews = [];
    }
    let rating_to_send = 0
    if(rating==0)
    {
      rating_to_send=0
    }
    else if(rating[0].round==null)
    {
      rating_to_send=0
    }
    else
    {
      rating_to_send = rating[0].round
    }
    const gameData=data[0];
    let n = gameData.involved_companies.length
    const myDate = new Date(gameData.first_release_date*1000)
    const companies = new Array(n);
    for(let i = 0;i<n;i++)
    {
      companies.push(gameData.involved_companies[i].company.name)
    }
    res.render('pages/game', {
      game_title: gameData.name,
      cover: gameData.cover.url,
      artworks: gameData.artworks,
      summary: gameData.summary,
      genre: gameData.genres,
      platform: gameData.platforms,
      developers: companies,
      date: myDate.toDateString(),
      screenshots: gameData.screenshots,
      rating: rating_to_send,
      username: req.session.user.username,
      reviews: reviews
    });
  } catch (error) {
    console.error("Error fetching game data:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});






















// *****************************************************
//                   <Start Server>
// *****************************************************
// app.listen(3000);
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');