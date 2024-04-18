# GamePlace

<h3>
  Application Description
</h3>
  Our application, GamePlace, is a video game analysis website. Users will be prompted to create their own login credentials to become a member of the GamePlace community. Once logged in, users should be able to explore the different video games that our site has data on, and even help contribute their own reviews! 
  <br>
	Our data will be shown to the user through different parts of the website. When looking at the explore page we will have different featured cards of video games that hold more information when clicked on.  Users can use the search bar to find a game they’d like to know more about, or they can discover games by filtering on a selected genre. Not only this, but users are able to create their own reviews on a game and read other reviews written by people in the community as well.  Along with leaving reviews, users can also like a game to add it to a personalized list of games that they can re-visit on their account page.
 <br>
  Once logged in and viewing the account page, users are able to see a display of all their liked games.  This makes it easier for all of our users to save and come back to games that they are interested in and want to save for future use.

<br><br>

<h3>
  Contributors
</h3>
Owen Brown, Sabrina Vu, Benjamin Apelman, Cole Garvey, Nate Cowan


<br><br>


<h3>
  Technology Stack
</h3>
- HTML/CSS <br>
- Node.js <br>
- PostgreSQL <br>
- Docker <br>
<br><br>

<h3>
  Application Prerequisites
</h3>
<h4>
  Git - 
</h4>
A version of Git must be installed on the local machine so the project repository is able to be cloned.
  
<h4>
  Docker - 
</h4>
A version of docker must be instaled on the machine where the application will be deployed.  The application is run locally within docker containers so there needs to be a pre-existing version of Docker or Docker Desktop installed on the machine. 

<h4>
  HTTP - 
</h4>
Given the application will be deployed on the local machine, you must have access to some sort of web client/browser where you can send HTTP requests to the local server.  However, you shouldn't have to worry about not having a web browser as they come standard with most machines.  Example of web browsers are but not limited to: Google Chrome, Mozilla Firefox, and Microsoft Edge. 

<br><br>


<h3>
  Running the Application
</h3>
Since  our application is not being hosted in the cloud or by any outside service, we will be deploying the application locally.  To get the application server running locally you must do the following:

<h4>
  Step 1:
</h4>
Make sure that you have docker and a web client installed on your device as mention above in the Application Prerequisites section.  This is an important step, if the application does not have the resources it needs to run, the application will not work. 

<h4>
  Step 2:
</h4>
We need to clone the repository on our local machine.  In the project repository, navigate to the bright green dropdown that says "<> Code".  Once clicked on, copy the HTTP url as we will need it to clone to project repository on our local machine.  

<h4>
  Step 3:
</h4>
Open up a terminal window and navigate to the local directory in which you want to store the repository files.  Once at this directory, you can enter the following command to clone the repository using git (the quotes are not included in the command). <br>
=# git clone "HTTP url here"

<h4>
  Step 4:
</h4>

In the same terminal window, navigate into the ‘ProjectSourceCode’ directory of the newly cloned repository.  This is where we will run the command to start the application server that allows us to view the application in the web browser.

<h4>
  Step 5:
</h4>
In the terminal, once in the ‘ProjectSourceCode’ directory run the following command: <br>
=# docker-compose up -d

<h4>
  Step 6:
</h4>
Wait a minute for the command to finish executing in the background.  While the docker containers are being created and the server is starting, open your web browser and enter the following url: <br>
- http://localhost:3000/ <br>
<br>
Once the server has started and localhost sends a response to your web browser, you will be able to see and interact with the application in your web browser.


<br><br>

<h3>
  Testing
</h3>
There is one file that needs to be changed in order to run the test cases.  Below is the path to the file from the root 'GamePlace' directory: <br>
- ProjectSourceCode/docker-compose.yaml <br>
<br>
Inside the 'docker-compose.yaml' file, currently located in line 25 is the 'command' run on start-up of the docker containers. We want to replace the currnet contents ('npm start') to the new command 'npm run testandrun'.  Once the line is changed you should be free to start up the containers and in the terminal see the test cases being run.


<br><br>


<h3>
  Deployed Application
</h3>
Application is run locally so there currently is no link.
