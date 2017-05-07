// --- CONSTANTS ---

var PORT_NUMBER = 1881;
var IMAGE_SIZE_LIMIT = '50mb'

// --- DEPENDENCIES ---

// express for web app
var express = require('express');
var session = require('express-session'); // don't know what this does but it's necessary

// body parser to parse post data
var bodyParser = require('body-parser');

//OAuth server for user authentication
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//Establish MySQL DB
var config = require('./config');
var mysql = require('mysql');
var connection = mysql.createConnection({
  multipleStatements: true,
  host     : config.db.host,
  user     : config.db.user,
  password : config.db.password,
  database : config.db.database
});
connection.connect();
connection.query('CREATE TABLE IF NOT EXISTS users (userID VARCHAR(255) NOT NULL, firstName VARCHAR(255), email VARCHAR(255));');
connection.query('CREATE TABLE IF NOT EXISTS images (imageKey INT NOT NULL AUTO_INCREMENT, filename VARCHAR(255), userID VARCHAR(255), PRIMARY KEY (imageKey));');
connection.query('CREATE TABLE IF NOT EXISTS keywords (imageKey INT, keyword VARCHAR(255));');

// multer for handling file uploads
var multer = require('multer');
var upload = multer({ 'dest': __dirname + '/uploads/tmp' });

// request body handling
var urlEncodedBody = bodyParser.urlencoded({limit:IMAGE_SIZE_LIMIT, extended:false})
var jsonBody = bodyParser.json({limit:IMAGE_SIZE_LIMIT})
var imageFileBody = upload.single('image_file');

// resemble.js
var resemble = require('node-resemble-js');
var sharp = require('sharp');

// request to get image from urls
var req = require('request');

// filesystem
var fs = require('fs');

// for detecting file type
var readChunk = require('read-chunk');
var fileType = require('file-type');

// for creating unique filenames
var shortid = require('shortid');

// --- BINDINGS ---

var app = express();
exports.app = app;
// console.log(upload.single('asd'));

// resemble.outputSettings({
//     largeImageThreshold: 0
// });

app.use(session({secret: 'photosafe',
				 saveUninitialized: true,
				 resave: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: config.oauth.client_id,
    clientSecret: config.oauth.client_secret,
    callbackURL: config.oauth.redirect_url,
    },
    function(accessToken, refreshToken, profile, done) {
        var q = 'SELECT * FROM users WHERE userID=?;';
        var args = [profile.id];
        connection.query(q, args, function (error, result) {
            if (error) {
                console.log(error);
                return done(error);
            } 
            var userInfo = {auth_token: accessToken, 
                            user_firstname: profile.name.givenName, 
                            user_email: profile.emails[0].value};

            if (result.length > 0) {
                return done(null, userInfo);
            } else {
                var insert = 'INSERT INTO users (userID, firstName, email) VALUES (?, ?, ?);'
                connection.query(insert, [profile.id, userInfo.user_firstname, userInfo.user_email]);
                return done(null, userInfo);
            }
       });
    })
);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

// --- ROUTES ---

// root
app.get('/', rootHandler);

app.get('/profile', isLoggedIn, function(request, response){
    var auth_token = request.user.auth_token;
    var user_firstname = request.user.user_firstname;
    var user_email = request.user.user_email;
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<p>Please wait...</p>');
    response.write('<span id="auth_token" style="display:none">' + auth_token + '</span>');
    response.write('<span id="user_firstname" style="display:none">' + user_firstname + '</span>');
    response.write('<span id="user_email" style="display:none">' + user_email + '</span>');
    response.end();
});

// login
app.get('/login', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/login/callback', passport.authenticate('google', {successRedirect: '/profile', failureRedirect: '/login'}));

//logout
app.get('/logout', function(request, response){
    request.logout();
    response.redirect('/');
})

// blacklist
app.get('/blacklist/keys', getAllBlacklistKeysHandler);
app.get('/blacklist/img', getBlacklistImageFileHandler);
app.get('/blacklist/img/info', getBlacklistImageInfoHandler);
app.post('/blacklist/add/url', urlEncodedBody, addUrlToBlacklistHandler);
app.post('/blacklist/add/img', imageFileBody, addImageFileToBlacklistHandler);
app.post('/blacklist/img/edit', jsonBody, editBlacklistImageHandler);
app.post('/blacklist/img/delete', urlEncodedBody, deleteBlacklistImageHandler);

// compare
app.post('/compare', urlEncodedBody, compareHandler);

// settings
app.get('/settings', getSettingsHandler);
app.post('/settings/update', jsonBody, updateSettingsHandler);

// --- HANDLERS ---

// root
function rootHandler(request, response) {
    response.json(['you', 'should not be here',1,2,3,4]);
    return;
}

// for POST 'blacklist/add/img?auth_token=asdasd'
// blacklists the image file as uploaded
function addImageFileToBlacklistHandler(request, response) {
    console.log(request.file);
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
    
    var userId = getUserIdFromAuthToken(authToken);
    addImageFileToBlacklist(userId, file, response);
    
    // var imageKey = addImageFileToBlacklist(file);
    // var data = {image_key:imageKey};
    // var responseObj = createResponseObj('success', data);
    // response.json(responseObj);
    // return;
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
    
    var userId = getUserIdFromAuthToken(authToken);
    if (!hasPermission(userId, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    if (!isValidImageInfo(imageInfo)) {
        var responseObj = createResponseObj('fail', null, {code:404, message:'image info not valid'})
        response.json(responseObj);
        return;
    }
    
    editImageAndSendResponse(imageKey, imageInfo, response);
    
    // var editSuccessful = editImage(imageKey, imageInfo);
    // if (!editSuccessful) {
    //     var responseObj = createResponseObj('fail', null, {code:500, message:'edit failed'})
    //     response.json(responseObj);
    //     return;
    // }
    // 
    // var responseObj = createResponseObj('success', editSuccessful);
    // response.json(responseObj);
    // return;
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
    
    var userId = getUserIdFromAuthToken(authToken);
    if (!hasPermission(userId, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    deleteImageAndSendResponse(imageKey, userId, response);
    // if (!deleteSuccessful) {
    //     var responseObj = createResponseObj('fail', null, {code:500, message:'delete failed'})
    //     response.json(responseObj);
    //     return;
    // }
    // 
    // var responseObj = createResponseObj('success', deleteSuccessful);
    // response.json(responseObj);
    // return;
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
    
    var userId = getUserIdFromAuthToken(authToken);
    if (!hasPermission(userId, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    getImageInfo(imageKey, response);
    
    // var imageInfo = getImageInfo(imageKey);
    // var responseObj = createResponseObj('success', imageInfo);
    // response.json(responseObj);
    // return;
}

function compareHandler(request, response) {
    var authToken = request.query.auth_token;
    var imageUrl = request.body.image_url;
    console.log("comparing " + imageUrl);
    
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
    
    var userId = getUserIdFromAuthToken(authToken);
    downloadAndCallback(imageUrl, userId, response, compare);
    // var responseObj = createResponseObj('success', similarityInfo);
    // response.json(responseObj);
    // return;
}

function getSettingsHandler(request, response) {
    var authToken = request.query.auth_token;
    
    if (!isValidAuthToken(authToken)) {
        var responseObj = createResponseObj('fail', null, {code:401, message:'auth token not valid'})
        response.json(responseObj);
        return;
    }
    
    var userId = getUserIdFromAuthToken(authToken);
    var userSettings = getUserSettings(userId);
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
    
    var userId = getUserIdFromAuthToken(authToken);
    var updateSuccessful = updateSettings(userId, settings);
    if (!updateSuccessful) {
        var responseObj = createResponseObj('fail', null, {code:500, message:'settings update failed'})
        response.json(responseObj);
        return;
    }
    
    var responseObj = createResponseObj('success', updateSuccessful);
    response.json(responseObj);
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
        var responseObj = createResponseObj('fail', null, {code:500, message:'not a valid url: '})
        response.json(responseObj);
        return;
    }
    
    var userId = getUserIdFromAuthToken(authToken);
    downloadAndCallback(imageUrl, userId, response, addFileToBlacklist);
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
    
    var userId = getUserIdFromAuthToken(authToken);
    if (!hasPermission(userId, imageKey)) {
        var responseObj = createResponseObj('fail', null, {code:403, message:'no permission to access image'})
        response.json(responseObj);
        return;
    }
    
    getFilepathFromImageKey(imageKey, response);
    // response.sendFile(filepath);
    // return;
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
    
    var userId = getUserIdFromAuthToken(authToken);
    getUserBlacklistKeys(userId, response);
    // var responseObj = createResponseObj('success', userBlacklistKeys);
    // response.json(responseObj);
    // return;
}

// --- HELPER FUNCTIONS ---

//verify user is logged in
function isLoggedIn(request, response, next) {
    if(request.isAuthenticated()){
        return next();
    }

    response.redirect('/login');
}

function getImageInfo(imageKey, apiResponse) {
    var keywords = [];
    var query = "SELECT keyword FROM keywords WHERE imageKey = ?;";
    var args = [imageKey];
    connection.query(query, args, function(error, result) {
        if (error) {
            console.log(error)
            return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
        }
        
        console.log("delete keywords of " + imageKey);
        console.log(result);
        result.forEach(function(keyword) {
            keywords.push(keyword.keyword);
        });
        
        console.log(keywords);
        sendSuccessResponse(apiResponse, {image_key: imageKey, image_keywords: keywords});
    });
}

function editImageAndSendResponse(imageKey, imageInfo, apiResponse) {
    console.log(imageKey);
    console.log(imageInfo);
    // replace all entries of imagekey in keywords db with new keywords
    // first delete all imagekey entries
    var query = "DELETE FROM keywords WHERE imageKey = ?;";
    var args = [imageKey];
    // insert into db
    connection.query(query, args, function(error, result) {
        if (error) {
            console.log(error)
            return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
        }
        
        console.log("delete keywords of " + imageKey);
        console.log(result);
        
        // if no keywords then end
        if (imageInfo.image_keywords.length === 0) {
            sendSuccessResponse(apiResponse, "No keywords added");
            return;
        }
            
        // now reinsert each keyword as one entry
        var query = "INSERT INTO keywords (imageKey, keyword) VALUES ?";
        var args = [];
        imageInfo.image_keywords.forEach(function(keyword) {
            args.push([imageKey, keyword]);
        });
        connection.query(query, [args], function(error, result) {
            if (error) {
                console.log(error);
                console.log(args);
                return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
            }
            
            console.log("insert new keywords of " + imageKey);
            console.log(result);
            
            sendSuccessResponse(apiResponse, result.message);
            return;
        });
    });
}

function addImageFileToBlacklist(userId, file, apiResponse) {
    var sourceFilepath = file.path;
    var fileExtension = getImageFileExtension(sourceFilepath);
    var destFilename = createTemporaryFilename() + "." + fileExtension;
    var destFilepath = 'uploads/' + destFilename;
    console.log("asdassad");
    console.log(sourceFilepath);
    console.log(destFilepath);
    // resize image
    sharp(sourceFilepath).resize(500).toFile(destFilepath, function(error, info) {
        if (error) {
            sendFailResponse(apiResponse, null, {code:500, message: "Resize failed. File Type not supported: " + fileExtension});
            return;
        }
        
        // add to blacklist
        console.log('pass');
        addFileToBlacklist('upload', destFilepath, destFilename, userId, apiResponse);
    });
}

function getUserBlacklistKeys(userId, apiResponse) {
    var query = "SELECT imageKey FROM images WHERE userID = ?";
    var args = [userId];
    // insert into db
    connection.query(query, args, function(error, result) {
        if (error) {
            console.log(error)
            return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
        }
        
        console.log("db query for " + userId);
        console.log(result);
        var imageKeys = [];
        result.forEach(function(e) {
            imageKeys.push(e.imageKey);
        });
        // console.log(imageKeys);
        sendSuccessResponse(apiResponse, imageKeys);
        return;
    });
}

// get user blacklist paths {key:1, path:img.jpg}
function getUserBlacklistPaths(userId, response, callback) {
    var query = "SELECT filename, imageKey FROM images WHERE userID = ?";
    var args = [userId];
    // insert into db
    connection.query(query, args, function(error, result) {
        if (error) {
            console.log(error)
            return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
        }
        
        console.log(result);
        console.log("db query for " + userId);
        var imagePaths = [];
        result.forEach(function(e) {
            imagePaths.push({key:e.imageKey, path:"uploads/" + e.filename});
        });
        console.log(imagePaths);
        callback(imagePaths);
        return;
    });
}

// gets filepath by image key
function getFilepathFromImageKey(imageKey, apiResponse) {
    var query = "SELECT filename FROM images WHERE imageKey = ?";
    var args = [imageKey];
    // insert into db
    connection.query(query, args, function(error, result) {
        if (error) {
            console.log(error)
            return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
        }
        
        console.log("db query for " + imageKey);
        if (result.length === 0) {
            console.log(result);
            return sendFailResponse(apiResponse, null, {code:404, message:"No image associated with image key " + imageKey});
        }
        
        console.log(result[0].filename);
        
        // return image key in response 
        var filename = result[0].filename;
        var filepath = __dirname + '/uploads/' + filename;
        console.log(filepath);
        apiResponse.sendFile(filepath);
        return;
    });
}

// downloads and store in blacklist
function downloadAndCallback(imageUrl, userId, apiResponse, callback) {
    req.get({url:imageUrl, encoding:null, method:'GET'}, function(error, response, body) {
        if (error) {
            sendFailResponse(apiResponse, null, {code:404, message:"Unable to access image " + imageUrl});
            return;
        }
        
        if (body) {
            ensureDirectorySync('uploads');
            var tempFilename = createTemporaryFilename();
            var fileExtension = getImageFileExtension(body);
            var destFilename = tempFilename + "." + fileExtension;
            var destFilepath = "uploads/" + destFilename;
            console.log(destFilepath);
            // resize image
            sharp(body).resize(500).toFile(destFilepath, function(error, info) {
                if (error) {
                    console.log(error)
                    sendFailResponse(apiResponse, null, {code:500, message:"Image resize failed. File type not supported: " + imageUrl});
                    return;
                }
                
                // add to blacklist
                console.log('resized');
                callback(imageUrl, destFilepath, destFilename, userId, apiResponse);
            });
            return;
        }
        
        return sendFailResponse(apiResponse, null, {code:404, message:"Image retrieval error " + imageUrl});
    });
}

// add url to blacklist in database
function addFileToBlacklist(imageUrl, downloadedFilepath, downloadedFilename, userId, apiResponse) {
    var query = 'INSERT INTO images (userID, filename) VALUES (?, ?);';
    var args = [userId, downloadedFilename];
    // insert into db
    connection.query(query, args, function(error, result) {
        if (error) {
            console.log(error)
            return sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
        }
        
        // console.log(result);
        // console.log("db query for " + downloadedFilename);
        
        // return image key in response 
        var imageKey = result.insertId;
        var data = {image_key:imageKey};
        var responseObj = createResponseObj('success', data);
        apiResponse.json(responseObj);
        return;
    });
}

// // downloads the image at the url and compares it against the user's blacklist
// // returning the response via apiResponse
// function downloadAndCompare(imageUrl, username, apiResponse) {
//     // download image
//     var imageDownload = req.get(imageUrl);
//     
//     // verify response code
//     imageDownload.on('response', function(res) {
//         if (res.statusCode !== 200) {
//             return sendCompareResponse(apiResponse, null, 'Response status was ' + res.statusCode);
//         }
//     });
// 
//     // check for request errors
//     imageDownload.on('error', function (err) {
//         return sendCompareResponse(apiResponse, null, err);
//     });
//     
//     // write the image to file, without extension
//     ensureDirectorySync('compare');
//     var downloadedFilepath = 'compare/' + createTemporaryFilename();
//     var downloadedFile = fs.createWriteStream(downloadedFilepath);
//     imageDownload.pipe(downloadedFile);
//     
//     // Handle errors
//     downloadedFile.on('error', function(err) { 
//         fs.unlinkSync(downloadedFilepath);
//         return sendCompareResponse(apiResponse, null, err.message);
//     });
//     
//     // carry out comparision if no errors
//     downloadedFile.on('finish', function() {
//         // close the stream
//         downloadedFile.close()
//             
//         // rename the downloaded file to its proper extension
//         var fileExtension = getImageFileExtension(downloadedFilepath);
//         if (fileExtension !== "jpeg" && fileExtension !== "jpg" && fileExtension !== "png") {
//             return sendCompareResponse(apiResponse, null, "unsupported file type: " + fileExtension);
//         }
//         
//         var downloadedFilepathExt = downloadedFilepath + "." + fileExtension;
//         fs.renameSync(downloadedFilepath, downloadedFilepathExt);
//         console.log(downloadedFilepathExt);
//         
//         // compare
//         compare(imageUrl, downloadedFilepathExt, username, apiResponse);
//     });
//     
//     // downloadedFile.end();
// }

// compares the given image (at the path) to the username's blacklist
// then returns the response via apiResponse
function compare(imageUrl, downloadedFilepath, downloadedFilename, userId, apiResponse) {
    // get the images to compare against
    getUserBlacklistPaths(userId, apiResponse, function(blacklistImagePaths) {
        // results of the comparisions in promise form
        var promises = [];
        blacklistImagePaths.forEach(function(imagePath) {
            promises.push(resemblePromise(downloadedFilepath, imagePath.path, imagePath.key));
        });
        
        // once comparisions are done, prepare info for response
        Promise.all(promises).then(function(promiseResults) {
            // console.log(promiseResults);
            var similarityInfos = promiseResults.map(function(result) {
                // console.log(result.data);
                var misMatchPercentage = parseFloat(result.data.misMatchPercentage);
                var similarity = (100.0 - misMatchPercentage) / 100.0;
                var similarityInfo = {image_key: result.key, similarity: similarity, compared: imageUrl}
                // console.log(similarityInfo);
                return similarityInfo;
            });
            console.log(similarityInfos);
            
            // send response
            sendCompareResponse(apiResponse, similarityInfos, null)
        });
    });
}

// converts the callback version of the resemble js image compare to a promise
// resize both images to 500px width before comparing. this reduces false positives
// TODO ensure that when uploading image for blacklist, the image is auto resized to 500 width
function resemblePromise(downloadedFilepath, imagePath, imageKey) {
    return new Promise(function(resolve, reject) {
        console.log(imagePath);
        
        // resize only the downloaded image
        var resizedDownloadedFilePath = getResizedFilePath(downloadedFilepath);
        // var resizedImagePath = getResizedFilePath(imagePath);
        
        // carry out resize as promise
        var resizedImages = [];
        resizedImages.push(sharp(downloadedFilepath).resize(500).toFile(resizedDownloadedFilePath));
        // resizedImages.push(sharp(imagePath).resize(500).toFile(resizedImagePath));
        // console.log(resizedImages);
        
        // compare resized image after promise returns
        Promise.all(resizedImages).then(function(resizedImageResults) {
            // console.log(resizedImageResults);
            try {
                var diff = resemble(resizedDownloadedFilePath).compareTo(imagePath).onComplete(function(data) {
                    console.log(data);
                    // return the comparision data
                    resolve({data:data, key:imageKey})
                });
            } catch (e) {
                resolve({error:e, data:{misMatchPercentage:'1'}, key: imageKey});
            }
        });
    });
}

// ensure directory exists
function ensureDirectorySync(directory) {  
    try {
        fs.statSync(directory);
    } catch(e) {
        fs.mkdirSync(directory);
    }
}

// gets the filepath of the resized image
function getResizedFilePath(filepath) {
    console.log(filepath);
    var split = filepath.split('.');
    return split[0] + '-re.' + split[1];
}

// creates a random filename 
function createTemporaryFilename() {
    return 'tempfile' + shortid.generate() + Date.now();
}

// returns the proper file extension of the file
function getImageFileExtension(buffer) {
    // console.log(imageFilepath);
    // var buffer = fs.readFileSync(imageFilepath);
    // const buffer = readChunk.sync(imageFilepath, 0, 4100);
    // console.log(buffer);
    var typeInfo = fileType(buffer);
    if (typeInfo) {
        var ext = typeInfo.ext;
        return ext;
    }
    
    return 'jpg';
}

// TODO unimplemented it because it's causing problems
// this function is a callback so it can't return a boolean
function hasPermission(userID, imageKey) {
    // connection.query(
    //     'SELECT imageKey FROM images WHERE imageKey=' + imageKey + 'AND userID=' + userID + ');', 
    //     function(error, result) {
    //         return (result == true);
    //     });
    return true;
}

// IMPLEMENTED
function getBlacklistImagePath(imageKey) {
    // query will never fail and will only ever return 1 result
    connection.query(
        'SELECT filename FROM images WHERE imageKey=' + imageKey + ';', 
        function(error, result) {
            return 'uploads/' + result[0].filename;
        });
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

function deleteImageAndSendResponse(imageKey, userId, apiResponse) {
    console.log("deleting " + imageKey + userId);
    var query = "DELETE FROM images WHERE userID = ? && imageKey = ?;";
    var args = [userId, imageKey];
    // insert into db
    connection.query(query, args, function(error, result) {
        if (error) {
            sendFailResponse(apiResponse, null, {code:500, message:"database error", error:error});
            return;
        }
        if (result.affectedRows === 0) {
            // nothing was deleted
            sendFailResponse(apiResponse, null, {code:500, message:"Nothing was deleted. Please check userID and imageKey"});
            return;
        }    
        
        var responseObj = createResponseObj('success', imageKey);
        apiResponse.json(responseObj);
        return;
    });
}

function isValidImageInfo(imageInfo) {
    if (imageInfo.image_keywords) {
        if (imageInfo.image_keywords.constructor === Array) {
            return true;
        }
        
        return false;
    }
    
    return false;
}

// TODO check if image key is valid
function isValidImageKey(imageKey) {
    if (imageKey) {
        return true;
    }
    
    return false;
}

// TODO check if file is an image
function isValidImageFile(file) {
    if (file) {
        return true;
    }
    
    return false;
}

// TODO check if url is valid
function isValidUrl(url) {
    if (url) {
        return true;
    }
    
    return false;
}

// TODO replace with actual validity check
function isValidAuthToken(authToken) {
    if (authToken) {
        return true;
    }
    
    return false;
}

// TODO replace with actual get
function getUserIdFromAuthToken(authToken) {
    return 'test_user';
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

function sendSuccessResponse(response, data) {
    var responseObj = createResponseObj('success', data);
    response.json(responseObj);
    return;
}

// sends a json response via the response object
function sendFailResponse(response, data, error) {
    var responseObj = createResponseObj('fail', data, error);
    response.json(responseObj);
    return;
}

// sends a json response via the response object
function sendCompareResponse(response, similarityInfo, error) {
    var responseObj = createResponseObj('success', similarityInfo);
    response.json(responseObj);
    return;
}

// --- LISTEN ---
app.listen(PORT_NUMBER);
