## NodeJS video streaming when files are split and on another server.
# What does it do?
It gets files from another server and streams them to client.
# How is it useful?
Well if you have your files on another server this could be quite useful for streaming videos.
# How to run it?
First you'll have to rewrite cacheManager.js to fit your needs. After that you can run 
```
node index.js
```
and put link into your html video tag with id and stream it to client.