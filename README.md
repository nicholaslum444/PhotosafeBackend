# PhotoSafeBackend
A repo housing our server-side code.


# Setup
* Node version: v6.10.2
* Required ports: 1880, 1881
* Landing page url: http://photosafe.tk
* API url: http://api.photosafe.tk

Dependencies should already be saved in package.json. Run `npm install` to install dependencies. Run `node server.js` to start the app.

Landing page is likely to be a static page. If not, it will take port 1880. The assumption here on is that it is a static page. If port is used, then follow similar instructions to the API server.

Separate repo for landing page should be made soon and these instructions should be there instead.

## Development
Access API via http://localhost:1881

Note: since the app will hardcode the api address, use a proxy agent on your local machine to route the actual api address to localhost. Disable the proxy routing when you want to access the real server.

## Production
Set apache/nginx to route http://photosafe.tk to the folder where the landing page files are stored

Set apache/nginx to route http://api.photosafe.tk to localhost port 1881, i.e. http://127.0.0.1:1881

This guide was followed: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04

## Setup Notes
If you encounter node-gyp error on Windows, download Visual C++ Build Tools 2015 and then run `npm config set msvs_version 2015`. Now node-gyp should work.


# Comparing Images
Dummy images are prepared in the `uploads/` folder: `poster.jpg`, `soccer.jpg` and `test.jpg`.

Both `poster.jpg` and `soccer.jpg` can be found on the http://nuscomputing.com/ home page. 

Ideally, both these images should be blocked when the user visits the site. No other image should be blocked.

Of course there may be false positives. It is up to the front-end to decide a suitable threshold.
