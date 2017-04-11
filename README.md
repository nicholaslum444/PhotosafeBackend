# PhotoSafeBackend
A repo housing our server-side code.

# Setup
Node version: v6.10.2
Required ports: 1880, 1881
Landing page url: http://photosafe.tk
API url: http://api.photosafe.tk

Landing page is likely to be a static page. If not, it will take port 1880. The assumption here on is that it is a static page. If port is used, then follow similar instructions to the API server.

Separate repo for landing page should be made soon and these instructions should be there instead.

## Development
Access API via http://localhost:1881

Note: since the app will hardcode the api address, use a proxy agent on your local machine to route the actual api address to localhost. Disable the proxy routing when you want to access the real server.

## Production
Set apache/nginx to route http://photosafe.tk to the folder where the landing page files are stored

Set apache/nginx to route http://api.photosafe.tk to localhost port 1881, i.e. http://127.0.0.1:1881

This guide was followed: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04
