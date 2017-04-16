// --- CONSTANTS ---

var PORT_NUMBER = 1881;
var IMAGE_SIZE_LIMIT = '50mb'

// --- DEPENDENCIES ---

// express for web app
var express = require('express');

// body parser to parse post data
var bodyParser = require('body-parser');

// multer for handling file uploads
var multer  = require('multer')

// --- BINDINGS ---

var app = express();
var upload = multer({ 'dest': __dirname + '/uploads/tmp' });
app.use(bodyParser.urlencoded({limit:IMAGE_SIZE_LIMIT, extended:false}));
app.use(bodyParser.json({limit:IMAGE_SIZE_LIMIT}));

// --- ROUTES ---

// root
app.get('/', root);

// blacklist
app.get('/blacklist/keys', getAllBlacklistKeysHandler);
app.get('/blacklist/img', getBlacklistImageFileHandler);
app.post('/blacklist/add/url', addUrlToBlacklistHandler);
app.post('/blacklist/add/img', upload.single('image_file'), addImageFileToBlacklistHandler);

// --- HANDLERS ---

// root
function root(request, response) {
    response.json([0,1,2,3,4]);
}

// for GET '/blacklist/keys?auth_token=asdad'
// gets all the keys in the user's blacklist
function getAllBlacklistKeysHandler(request, response) {
    var authToken = request.query.auth_token;
    if (isValidAuthToken(authToken)) {
        var username = getUsernameFromAuthToken(authToken);
        var userBlacklistKeys = getUserBlacklistKeys(username);
        var responseObj = createResponseObj('success', userBlacklistKeys);
        response.json(responseObj);
    } else {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
    }
}

// for GET 'blacklist/img?auth_token=asdasd&image_key=qweqwe'
// gets the image file that corresponds to the image key
function getBlacklistImageFileHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageKey = request.query.image_key;
    if (isValidAuthToken(authToken)) {
        if (isValidImageKey(imageKey)) {
            var username = getUsernameFromAuthToken(authToken);
            var filepath = getFilepathFromImageKey(imageKey);
            response.sendFile(filepath);
        } else {
            var responseObj = createResponseObj('fail', null, {code:404, message:'image key not valid'})
            response.json(responseObj);
        }
    } else {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
    }
}

// for POST 'blacklist/add/url?auth_token=asdasd'
// blacklists the image file at the given url
function addUrlToBlacklistHandler(request, response) {
    var authToken = request.query.auth_token;
    if (isValidAuthToken(authToken)) {
        var username = getUsernameFromAuthToken(authToken);
        var imageUrl = request.body.image_url;
        var imageKey = addUrlToBlacklist(imageUrl);
        var data = {image_key:imageKey};
        var responseObj = createResponseObj('success', data);
        response.json(responseObj);
    } else {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
    }
}

// for POST 'blacklist/add/img?auth_token=asdasd'
// blacklists the image file as uploaded
function addImageFileToBlacklistHandler(request, response) {
    var authToken = request.query.auth_token;
    if (isValidAuthToken(authToken)) {
        var username = getUsernameFromAuthToken(authToken);
        var file = request.file;
        if (isValidImageFile(file)) {
            var imageKey = addImageFileToBlacklist(file);
            var data = {image_key:imageKey};
            var responseObj = createResponseObj('success', data);
            response.json(responseObj);
        } else {
            var responseObj = createResponseObj('fail', null, {code:500, message:'file not valid'})
            response.json(responseObj);
        }
    } else {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
    }
}

// --- HELPER FUNCTIONS ---

// TODO implement add url to blacklist
function addUrlToBlacklist(imageUrl) {
    return 'image-key-af8163d7e9a000';
}

// TODO implement add image file to blacklist
function addImageFileToBlacklist(file) {
    return 'image-key-af8163d7e9a999';
}

// TODO replace with actual functionality
function getUserBlacklistKeys(username) {
    return ['blacklist', 'of', 'images', username]
}

// TODO check if image key is valid
function isValidImageKey(imageKey) {
    if (imageKey) {
        return true;
    } else {
        return false;
    }
}

// TODO check if file is an image
function isValidImageFile(file) {
    if (file) {
        return true;
    } else {
        return false;
    }
}

// TODO implement get by image key
function getFilepathFromImageKey(imageKey) {
    return __dirname + '/uploads/test.jpg';
}

// creates the response object to be returned in api
function createResponseObj(status, data, fail) {
    var responseObj = {};
    responseObj.status = status;
    if (status === 'success') {
        responseObj.data = data;
    } else {
        responseObj.fail = fail
    }
    return responseObj;
}

// TODO replace with actual validity check
function isValidAuthToken(authToken) {
    if (authToken) {
        return true;
    } else {
        return false;
    }
}

// TODO replace with actual get
function getUsernameFromAuthToken(authToken) {
    return 'nick';
}

// --- LISTEN ---
app.listen(PORT_NUMBER);
