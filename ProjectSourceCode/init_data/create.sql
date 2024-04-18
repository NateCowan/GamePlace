-- User info 
CREATE TABLE IF NOT EXISTS users(
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password CHAR(60) NOT NULL
);

-- Review from a user 
CREATE TABLE IF NOT EXISTS reviews(
    review_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    review_text VARCHAR(280) NOT NULL,
    rating INT NOT NULL,
    game_title VARCHAR(50)
);

-- Link users to reviews
CREATE TABLE IF NOT EXISTS users_to_reviews(
    user_id INT NOT NULL,
    review_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (review_id) REFERENCES reviews (review_id)
);


-- Game info
CREATE TABLE IF NOT EXISTS game_data(
    game_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    summary TEXT NOT NULL,
    release_date VARCHAR(25) NOT NULL,
    total_rating smallint NOT NULL,
    cover_url TEXT NOT NULL
);

-- Game genres
CREATE TABLE IF NOT EXISTS game_genres(
    genre_id SERIAL PRIMARY KEY,
    genre VARCHAR(25) NOT NULL
);

-- Links game to genres
CREATE TABLE IF NOT EXISTS game_to_genres(
    game_id INT NOT NULL,
    genre_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game_data (game_id),
    FOREIGN KEY (genre_id) REFERENCES game_genres (genre_id)
);


-- Follow table
CREATE TABLE IF NOT EXISTS follows (
    follow_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    game_title VARCHAR(50)
);

-- Link users to follows
CREATE TABLE IF NOT EXISTS users_to_follows(
    user_id INT NOT NULL,
    follow_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (follow_id) REFERENCES follows (follow_id)
);




-- -- Create a user for testing ---> testUser password is 'test'
insert into users (username, password) values ('testUser', '$2a$04$nisAeVLmVfS6oezJ35eBQeZcDtB2eCMR1rZHzMGdz9cvhOLYNR2na');
insert into users (username, password) values ('x', '$2y$10$HbdbQsrcj6qfn0R2CZYdmujsaZeRLrQFWwhQ3ZylPVl/s9vR65DJe');

-- Add fake reviews for testing
insert into reviews (username, review_text,rating,game_title) values ('testUser','The game was good',3,'The Legend of Zelda: A Link to the Past');
insert into reviews (username, review_text,rating,game_title) values ('testUser','It could use some more features',2,'The Legend of Zelda: A Link to the Past');
insert into reviews (username, review_text,rating,game_title) values ('testUser','Could use some more explosions',1,'Halo 5: Guardians');

-- Add a few games for testing
insert into game_data (name, summary, release_date, total_rating, cover_url) values (
    'Fortnite',
    'Build stuff and shoot things',
    'April 6th, 2024',
    3,
    'link to img'
    );

-- Add game genres
insert into game_genres (genre) values ('Action');
insert into game_genres (genre) values ('Adventure');
insert into game_genres (genre) values ('Battle Royale');


-- Link user to reviews by id 
insert into users_to_reviews (user_id, review_id) values (1, 1);
insert into users_to_reviews (user_id, review_id) values (1, 2);
insert into users_to_reviews (user_id, review_id) values (1, 3);

-- Link game to genres by id
insert into game_to_genres (game_id, genre_id) values (1, 1);
insert into game_to_genres (game_id, genre_id) values (1, 2);
insert into game_to_genres (game_id, genre_id) values (1, 3);