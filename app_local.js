var express = require("express");

// var http = require('http');
var http = require("https");
var path = require("path");
var favicon = require("serve-favicon");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var methodOverride = require("method-override");
var serveStatic = require("serve-static");
var fs = require("fs");

var app = express();

var options = {
  key: fs.readFileSync("autovalidacion.izzi.mx.key"),
  cert: fs.readFileSync("autovalidacion.izzi.mx.crt"),
};

app.set("port", 7800);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(favicon(path.join(__dirname, "public", "favicon.png")));
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "jiojfkvifos",
    cookie: { maxAge: 3600000 },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(methodOverride());
app.use(serveStatic(path.join(__dirname, "public")));

require("./routes")(app);

http.createServer(options, app).listen(app.get("port"), function () {
  console.log("Express server listening on port " + app.get("port"));
});

// http.createServer(app).listen(app.get('port'), '172.20.80.92', function()
// {
//   console.log('Express server listening on port ' + app.get('port'));
// });
