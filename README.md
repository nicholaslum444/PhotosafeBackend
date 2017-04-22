# PhotoSafeBackend
A repo housing our server-side code.

# Setup
## Basic Environment

* Node: v6.10.2
* mysql: Ver 14.14 Distrib 5.5.54
* Required ports: 1881
* API url: http://api.photosafe.tk

### Google OAuth
You will need a Google OAuth account to perform the OAuth service. Create one before continuing.

OAuth URL should be `http://localhost:1881/login` and the redirect URL should be `http://localhost:1881/login/callback`.

Remember the client ID and the client secret. You will need it later.

### Database
Photosafe uses mysql as its database. Install mysql before continuing.

Log in to mysql with an admin account and run `CREATE DATABASE photosafe;`. Remember the account username and password. We will need it later.

### Configuration
Secrets and configuration information are stored in `config.js`. However this file is gitignored to prevent leaking of secrets.

We provide an example file `config.js.example`. Run `cp config.js.example config.js` to create `config.js` in the same directory. DO NOT DELETE THE ORIGINAL EXAMPLE FILE.

Edit the `config.js` file with the required information. You will need the database account information and Google OAuth information as mentioned above.

### Node
Dependencies should already be saved in `package.json`. 

Run `npm install` to install dependencies. 

Run `node server.js` to start the app.

### Errors
If there are missing dependency errors, run `npm install <ANY_MISSING_DEPENDENCIES>` to add them. 

If you encounter a node-gyp error on Windows, download Visual C++ Build Tools 2015 and then run `npm config set msvs_version 2015`. Now node-gyp should work. Run `npm install <DEPENDENCY_WHICH_CAUSED_ERROR>` to redo the installation.

If there are any other errors, ensure that all steps above have been followed. Try turning it off and on again. 

Contact us if there are any further issues.

## Development Environment
Access API via http://localhost:1881

Note: since the app will hardcode the api address, use a proxy agent on your local machine to route the actual api address to localhost. Disable the proxy routing when you want to access the real server.

## Production Environment
Set apache/nginx to route http://photosafe.tk to the folder where the landing page files are stored.

Set apache/nginx to route http://api.photosafe.tk to localhost port 1881, i.e. http://127.0.0.1:1881.

This guide was followed: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04.


# Google OAuth
Use a google account to log in to photosafe. We only make use of the user's email and first name.


# Comparing Images
Dummy images are prepared in the `uploads/` folder: `poster.jpg`, `scocer.jpg` and `test.jpg`.

Both `poster.jpg` and `soccer.jpg` can be found on the http://nuscomputing.com/ home page. 

Ideally, both these images should be blocked when the user visits the site. No other image should be blocked.

Of course there may be false positives. It is up to the front-end to decide a suitable threshold.
