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
// app.get('/explore', (req, res) => {
//   res.render('pages/explore');
// });

app.get('/account', async (req, res) => {
  try {
    const username = req.session.user.username; 

    // Query to fetch the game titles the user follows
    const followedGamesQuery = 'SELECT game_title FROM follows WHERE username = $1;';
    const followedGames = await db.any(followedGamesQuery, [username]);
    const firstInitial = req.session.user.username.charAt(0).toUpperCase();
    // Render the account page and pass the followed games to the template
    res.render('pages/account', {
      // ... other user info ...
      username : req.session.user.username,
      firstInitial: firstInitial,
      followedGames: followedGames
    });
  } catch (error) {
    console.error('Error fetching followed games:', error);
    res.status(500).send('An error occurred while fetching followed games.');
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
    let date_to_send = 'No date'
    try
    {
      date_to_send = new Date(gameData.first_release_date*1000).toDateString()
    }
    catch
    {
      console.log('No release date'); myDate = 0;
    }
    let cover_to_return = "https://t4.ftcdn.net/jpg/01/09/00/83/360_F_109008395_OQDupHMza1V6CNOzrJwWAKlaktT4IsRW.jpg"
    if(gameData.cover)
    {
      cover_to_return = gameData.cover.url
    }
    let companies = []
    let message = ''
    try{
      let n = gameData.involved_companies.length
      companies = new Array(n);
      for(let i = 0;i<n;i++)
      {
        companies.push(gameData.involved_companies[i].company.name)
      }
    }
    catch
    {
      console.log('No involved companies')
      message = 'This game contains incomplete data from IGDB, sorry!'
      companies = []
    }
    // Render the game page with data
    res.render('pages/game', {
      game_title: gameData.name,
      cover: cover_to_return,
      artworks: gameData.artworks,
      summary: gameData.summary,
      genre: gameData.genres,
      platform: gameData.platforms,
      developers: companies,
      date: date_to_send,
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




//Defualt Explore page displays first 10 games without constraints
app.get('/explore', async (req, res) => {
  try {
    const response = await axios({
      url: `https://api.igdb.com/v4/games`,
      method: `POST`,
      dataType: `json`,
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      data: "fields cover.*,name,genres.name;"
    });

    console.log(response.data); // Log the data to see if it's fetched correctly

    res.render('pages/explore', {
      result: response.data,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Partially working serach that doesnt work when genre is not provided
app.post('/explore', async (req, res) => {
  try {
    const { search, genre } = req.body;

    // Your code to fetch filtered results based on search query and genre
    // You can modify the IGDB API call as needed to filter based on search and genre

    const response = await axios({
      url: `https://api.igdb.com/v4/games`,
      method: `POST`,
      dataType: `json`,
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      data: `fields cover.*,name,genres.name; where genres.name = "${genre}" & name ~ *"${search}"*;`
    });
    // Render the explore page with filtered results
    res.render('pages/explore', {
      result: response.data
    });
    //res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





















//------------------------------search actual implmentation ----------------------------------

app.get('/chat', async (req,res) => {
  try{
  const query =
      `SELECT * FROM chats WHERE game_title = '${req.query.game_title}'`;
    const data =  await db.query(query);
    console.log(data)
    res.render('pages/chat', {
      game_title: req.query.game_title,
      username: req.session.user.username,
      chats: data
    });
  }
  catch(error)
  {
    console.error("Error fetching review data:", error);
  res.status(500).json({ error: 'Internal Server Error' });
}
});

app.post('/chat', async (req,res) => {
  try{
  const query =
      `insert into chats (username, msg, game_title) values ($1, $2, $3)  returning *;`;
    const data =  await db.task('get-everything', task => {
      return task.batch([task.any(query, [
        req.body.username,
        req.body.msg,
        req.body.game_title,
      ])]);
    });
    try
    {
      const size_query =
      `SELECT COUNT(*) FROM chats;`;
    const data_1 = await db.query(size_query)
    console.log(data_1)
    if((data_1[0].count)>20)
    {
      try{
      const rem_old = `DELETE FROM chats WHERE chat_id = (SELECT chat_id FROM chats WHERE game_title = '${req.body.game_title}' LIMIT 1);`
      await db.query(rem_old)
      }
      catch(error)
      {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
    try{
      const get_msgs =
          `SELECT * FROM chats WHERE game_title = '${req.body.game_title}'`;
        const msg_data = await db.query(get_msgs);
        console.log(msg_data)
        res.render('pages/chat', {
          game_title: req.body.game_title,
          username: req.session.user.username,
          chats: msg_data
        });
      }
      catch(error)
      {
        console.error("Error fetching msgs:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  catch(error)
  {
    console.error("Error sizing chats:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
  catch(error)
  {
    console.error("Error adding chat:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




//We may not need this endpoint? But it is a good prototype of what an endpoint with this api look like. 
app.get('/get_genre', async (req, res) => {
  try {
    const response = await axios({
      url: `https://api.igdb.com/v4/genres`,
      method: `POST`,
      dataType: `json`,
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      data: "fields checksum,created_at,name,slug,updated_at,url;"
    });

    // Send the JSON data back to the client
    res.json(response.data);
  } catch (err) {
    console.error(err);
    // Send an error response if something goes wrong
    res.status(500).json({ error: 'Internal Server Error, Bearer ${process.env.access_token}' });
  }
});


// //Route to render selected game page

app.get('/game', async (req, res) => {
  try {
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      body: `fields name,cover.*,artworks.*,summary,genres.*,platforms.*,involved_companies.company.*,screenshots.*,first_release_date; where name = "${req.query.game_title}";`
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from IGDB');
    }
    const data = await response.json();
    console.log(data); // Log the data
    
    let reviews = [];
    let rating = 0;

    try {
      reviews = await db.query(`SELECT * FROM reviews WHERE game_title = '${req.query.game_title}'`);
      rating = await db.query(`SELECT ROUND(AVG(rating),2) FROM reviews WHERE game_title = '${req.query.game_title}'`);
    }
    catch (error)
    {
      console.error("Error fetching review data:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
    if(rating[0].round==null)
    {
      rating[0].round=0
    }
    const gameData=data[0];
    console.log("Fetched gameData...")
    console.log(gameData)
    let companies = []
    let myDate = 0
    let message = ''
    try{
      let n = gameData.involved_companies.length
      companies = new Array(n);
      for(let i = 0;i<n;i++)
      {
        companies.push(gameData.involved_companies[i].company.name)
      }
    }
    catch
    {
      console.log('No involved companies')
      message = 'This game contains incomplete data from IGDB, sorry!'
      companies = []
    }
    try{
    myDate = new Date(gameData.first_release_date*1000).toDateString()
    }
    catch{console.log('No release date'); myDate = 0;}
    cover_to_return = "https://t4.ftcdn.net/jpg/01/09/00/83/360_F_109008395_OQDupHMza1V6CNOzrJwWAKlaktT4IsRW.jpg"
    if(gameData.cover)
    {
      cover_to_return = gameData.cover.url
    }
    
    res.render('pages/game', {
      game_title: gameData.name,
      cover: cover_to_return,
      artworks: gameData.artworks,
      summary: gameData.summary,
      genre: gameData.genres,
      platform: gameData.platforms,
      developers: companies,
      date: myDate,
      screenshots: gameData.screenshots,
      rating: rating[0].round,
      username: req.session.user.username,
      reviews: reviews,
      message: message
    });
  } catch (error) {
    console.error("Error fetching game data:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Route to follow a game
app.post('/game/follow', async (req, res) => {
  try {
    // Insert into follows table and get follow_id
    const followQuery = 'INSERT INTO follows (username, game_title) VALUES ($1, $2) RETURNING follow_id;';
    const followResult = await db.one(followQuery, [req.body.username, req.body.game_title]);
    
    // If insertion was successful, retrieve the user_id
    if (followResult) {
      const userQuery = 'SELECT user_id FROM users WHERE username = $1;';
      const userResult = await db.one(userQuery, [req.body.username]);

      // Insert into users_to_follows table
      if (userResult) {
        const usersToFollowsQuery = 'INSERT INTO users_to_follows (user_id, follow_id) VALUES ($1, $2);';
        await db.none(usersToFollowsQuery, [userResult.user_id, followResult.follow_id]);
        
        // Respond with success message
        res.redirect('/account');
        
      } else {
        res.status(404).send('User not found.');
      }
    } else {
      res.status(400).send('Could not follow the game.');
    }
  } catch (error) {
    console.error('Error following game:', error);
    res.status(500).send('An error occurred while following the game.');
  }
});


// Gets all games a user is following
/* app.get('/follow', async (req, res) => {

}); */


app.get('/explore', async (req, res) => {
  try {
    const response = await axios({
      url: `https://api.igdb.com/v4/games`,
      method: `POST`,
      dataType: `json`,
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      data: "fields artworks,name,genres.name;"
    });

    console.log(response.data); // Log the data to see if it's fetched correctly

    res.render('pages/explore', {
      result: response.data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


//Partially working serach that doesnt work when genre is not provided
app.post('/explore', async (req, res) => {
  try {
    const { search, genre } = req.body;

    // Your code to fetch filtered results based on search query and genre
    // You can modify the IGDB API call as needed to filter based on search and genre

    const response = await axios({
      url: `https://api.igdb.com/v4/games`,
      method: `POST`,
      dataType: `json`,
      headers: {
        'Accept': 'application/json',
        'Client-ID': process.env.client_id,
        'Authorization': process.env.access_token,
      },
      data: `fields artworks,name,genres.name; where genres.name = "${genre}" & name ~ *"${search}"*;`
    });
    // Render the explore page with filtered results
    res.render('pages/explore', {
      result: response.data
    });
    //res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});














// *****************************************************
//                   <Start Server>
// *****************************************************
// app.listen(3000);
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');



