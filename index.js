// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var moment = require('moment');
var _ = require('underscore');
var md5 = require('cloud/libs/md5.js');
var Buffer = require('buffer').Buffer;

var responsesController = require(__dirname + 'cloud/controllers/responses.js');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  clientKey: process.env.CLIENT_KEY || '', //Add your client key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: [] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// The information showed about the poster
var userEmail = 'hello@oakvideos.com';
var userDisplayName = 'Oak Videos';
var userDescription = 'Viewer';

// Global app configuration section
app.set('views', 'cloud/views');  // Specify the folder to find templates
app.set('view engine', 'ejs');    // Set the template engine
app.use(express.bodyParser());    // Middleware for reading request body

// You can use app.locals to store helper methods so that they are accessible
// from templates.
app.locals._ = _;
app.locals.hex_md5 = md5.hex_md5;
app.locals.userEmail = userEmail;
app.locals.userDisplayName = userDisplayName;
app.locals.userDescription = userDescription;
app.locals.formatTime = function(time) {
  return moment(time).format('MMMM Do YYYY, h:mm a');
};
// Generate a snippet of the given text with the given length, rounded up to the
// nearest word.
app.locals.snippet = function(text, length) {
  if (text.length < length) {
    return text;
  } else {
    var regEx = new RegExp("^.{" + length + "}[^ ]*");
    return regEx.exec(text)[0] + "...";
  }
};

///////////////////////////
// Routes
///////////////////////////

// RESTful routes for the blog response object.
app.get('/responses', function(req, res) {
  res.render('hello', { message: "Do you know which response you wanted to watch?" });
});

app.get('/responses/:id', responsesController.show);

app.get('/u/:id', responsesController.showUser);

app.get('/u', function(req, res) {
  res.render('hello', { message: "Do you know which user's responses you wanted to watch?" });
});

// DEBUG
// Show all responses on homepage
// app.get('/debug', responsesController.index);
app.get('/debug', function(req, res) {
	var un = 'oakadmin';
	var pw = '#zQ87xbNsV#GBiL';
    if(un == undefined && pw == undefined) { res.end(); return; }
    if(!req.headers['authorization']){
        res.writeHead(401, {'WWW-Authenticate': 'Basic realm="Secure Area"', 'Content-Type': 'text/plain'});
        res.end("You must have credentials for this page");
        return;
    }
    var header=req.headers['authorization']||'',        // get the header
        token = header.split(/\s+/).pop()||'',            // and the encoded auth token
        auth = new Buffer(token, 'base64').toString(),    // convert from base64
        parts = auth.split(/:/),                          // split on colon
        username = parts[0],
        password = parts[1];
    if(username != un || password != pw){
        res.writeHead(401, {'WWW-Authenticate': 'Basic realm="Secure Area"', 'Content-Type': 'text/plain'});
		res.end("Incorrect username or password");
    }
    else {
    	res.statusCode = 200;
    	responsesController.index(req, res);
    }
});


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
