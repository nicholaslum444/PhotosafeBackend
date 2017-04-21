var express = require('express');
var session = require('express-session'); // don't know what this does but it's necessary
// body parser to parse post data
var bodyParser = require('body-parser');
//OAuth server for user authentication
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
//Establish MySQL DB
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'photosafe'
});
connection.connect();
connection.query('CREATE TABLE IF NOT EXISTS users (googleID VARCHAR(255) NOT NULL, firstName VARCHAR(255), email VARCHAR(255));');

// --- APP ---
var app = express();
var PORT_NUMBER = 1881;

// --- BINDINGS ---
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
// app.use(session({secret: 'photosafe',
// 				 saveUninitialized: true,
// 				 resave: true}));
app.use(passport.initialize());
app.use(passport.session());

var CLIENT_ID = '252949635913-31l4et5ap2gcbfg3dqhp4jf807cppcel.apps.googleusercontent.com';
var CLIENT_SECRET = 'WUE6Wj1A50ZtqMfnq01OVGIq';
var REDIRECT_URL = 'http://localhost:1881/login/callback';

passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: REDIRECT_URL
  	},
  	function(token, tokenSecret, profile, done) {
      	connection.query('SELECT * FROM users WHERE googleID=' + profile.id + ';', function (error, results, fields) {
  			if (error) {
  				return done(err);
			  } 

        var userInfo = {auth_token: token, first_name: profile.name.givenName};
        if (results) {
				  return done(null, userInfo);
			  } else {
          // add user to DB
          return done(null, userInfo);
        }
	});
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// --- ROUTES ---
app.get('/', function(request, response){
    response.json([0,1,2,3,4]);
});


app.get('/login', passport.authenticate('google', { scope: ['profile', 'email'] }));


app.get('/login/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

// --- LISTEN ---
app.listen(PORT_NUMBER);
