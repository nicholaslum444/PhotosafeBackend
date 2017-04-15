// --- DEPENDENCIES ---
// express for web app
var express = require('express');
// body parser to parse post data
var bodyParser = require('body-parser');

// --- APP ---
var app = express();
var PORT_NUMBER = 1881;

// --- ROUTES ---
app.get('/', function(request, response){
    response.json([0,1,2,3,4]);
});

// --- BINDINGS ---
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// --- LISTEN ---
app.listen(PORT_NUMBER);
