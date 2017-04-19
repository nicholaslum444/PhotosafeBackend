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
app.use(bodyParser.urlencoded({limit:IMAGE_SIZE_LIMIT, extended:true}));
app.use(bodyParser.json({limit:IMAGE_SIZE_LIMIT}));

// --- ROUTES ---

// root
app.get('/', rootHandler);

// blacklist
app.post('/blacklist/add/url', addUrlToBlacklistHandler);
app.post('/blacklist/add/img', upload.single('image_file'), addImageFileToBlacklistHandler);
app.get('/blacklist/keys', getAllBlacklistKeysHandler);
app.get('/blacklist/img/info', getBlacklistImageInfoHandler);
app.post('/blacklist/img/edit', editBlacklistImageHandler);
app.post('/blacklist/img/delete', deleteBlacklistImageHandler);
app.get('/blacklist/img', getBlacklistImageFileHandler);

// compare
app.post('/compare', compareHandler);

// settings
app.get('/settings', getSettingsHandler);
app.post('/settings/update', updateSettingsHandler);

// --- HANDLERS ---

// root
function rootHandler(request, response) {
    response.json([0,1,2,3,4]);
    return;
}

// for POST 'blacklist/add/url?auth_token=asdasd'
// blacklists the image file at the given url
function addUrlToBlacklistHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageUrl = request.body.image_url;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidUrl(imageUrl)) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'not a valid url'})
        response.json(responseObj);
        return;
    }
    
    var imageKey = addUrlToBlacklist(imageUrl);
    var data = {image_key:imageKey};
    var responseObj = createResponseObj('success', data);
    response.json(responseObj);
    return;
}

// for POST 'blacklist/add/img?auth_token=asdasd'
// blacklists the image file as uploaded
function addImageFileToBlacklistHandler(request, response) {
    var authToken = request.query.auth_token;
    var file = request.file;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidImageFile(file)) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'file not a valid image'})
        response.json(responseObj);
        return;
    }
    
    var imageKey = addImageFileToBlacklist(file);
    var data = {image_key:imageKey};
    var responseObj = createResponseObj('success', data);
    response.json(responseObj);
    return;
}

// for GET '/blacklist/keys?auth_token=asdad'
// gets all the keys in the user's blacklist
function getAllBlacklistKeysHandler(request, response) {
    var authToken = request.query.auth_token;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    var userBlacklistKeys = getUserBlacklistKeys(username);
    var responseObj = createResponseObj('success', userBlacklistKeys);
    response.json(responseObj);
    return;
}

// for GET 'blacklist/img?auth_token=asdasd&image_key=qweqwe'
// gets the image file that corresponds to the image key
function getBlacklistImageFileHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageKey = request.query.image_key;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidImageKey(imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:404, message:'image key not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    if (!hasPermission(username, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    var filepath = getFilepathFromImageKey(imageKey);
    response.sendFile(filepath);
    return;
}

function editBlacklistImageHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageKey = request.query.image_key;
    var imageInfo = request.body.image_info;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidImageKey(imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:404, message:'image key not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    if (!hasPermission(username, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    var editSuccessful = editImage(imageKey, imageInfo);
    if (!editSuccessful) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'edit failed'})
        response.json(responseObj);
        return;
    }
    
    var responseObj = createResponseObj('success', editSuccessful);
    response.json(responseObj);
    return;
}

function deleteBlacklistImageHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageKey = request.query.image_key;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidImageKey(imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:404, message:'image key not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    if (!hasPermission(username, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    var deleteSuccessful = deleteImage(imageKey);
    if (!deleteSuccessful) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'delete failed'})
        response.json(responseObj);
        return;
    }
    
    var responseObj = createResponseObj('success', deleteSuccessful);
    response.json(responseObj);
    return;
}

function getBlacklistImageInfoHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageKey = request.query.image_key;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidImageKey(imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:404, message:'image key not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    if (!hasPermission(username, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    var imageInfo = getImageInfo(imageKey);
    var responseObj = createResponseObj('success', imageInfo);
    response.json(responseObj);
    return;
}

function compareHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageUrl = request.body.image_url;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidUrl(imageUrl)) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'not a valid url'})
        response.json(responseObj);
        return;
    }
    
    var similarityInfo = compare(imageUrl);
    var responseObj = createResponseObj('success', similarityInfo);
    response.json(responseObj);
    return;
}

function getSettingsHandler(request, response) {
    var authToken = request.query.auth_token;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    var userSettings = getUserSettings(username);
    var responseObj = createResponseObj('success', userSettings);
    response.json(responseObj);
    return;
}

function updateSettingsHandler(request, response) {
    var authToken = request.query.auth_token;
    var settings = request.body.settings;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    var username = getUsernameFromAuthToken(authToken);
    var updateSuccessful = updateSettings(username, settings);
    if (!updateSuccessful) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'settings update failed'})
        response.json(responseObj);
        return;
    }
    
    var responseObj = createResponseObj('success', updateSuccessful);
    response.json(responseObj);
    return;
}

// --- HELPER FUNCTIONS ---

// TODO implement permission check for images
function hasPermission(username, imageKey) {
    return true;
}

// TODO implement comparision for image
function compare(imageKey) {
    return [{
        image_key: '78e67d8f9a569db686c54c8e67.jpg',
        similarity: 0.9
    },{
        image_key: '88e6769db686d8f9a5c54c8e67.jpg',
        similarity: 0.2
    }];
}

// TODO implement get user's settings
function getUserSettings(username) {
    return {
        sites_ignored: [
            'url_of_site_1', 
            'url_of_site_2'
        ]
    }
}

// TODO implement update settings, and return success true
function updateSettings(username, settings) {
    return true;
}

// TODO implement get image info
function getImageInfo(imageKey) {
    return {image_keywords: ['keywords', 'of', 'image', imageKey]}
}

// TODO implement edit image, and return success true
function editImage(imageKey, imageInfo) {
    return true;
}

// TODO implement delete image, and return success true
function deleteImage(imageKey) {
    return true;
}

// TODO implement add url to blacklist
function addUrlToBlacklist(imageUrl) {
    return 'image-key-af8163d7e9a000';
}

// TODO implement add image file to blacklist
function addImageFileToBlacklist(file) {
    return 'image-key-af8163d7e9a999';
}

// TODO implement get blacklist of user
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

// TODO check if url is valid
function isValidUrl(url) {
    if (url) {
        return true;
    } else {
        return false;
    }
}

// TODO implement get by image key
function getFilepathFromImageKey(imageKey) {
    return __dirname + '/uploads/test.jpg';
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

// --- LISTEN ---
app.listen(PORT_NUMBER);
