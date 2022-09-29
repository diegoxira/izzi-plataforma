var express = require("express");

//var http = require("http");
var http = require("https");
var path = require("path");
var favicon = require("serve-favicon");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var methodOverride = require("method-override");
var serveStatic = require("serve-static");
var fs = require("fs");
var helmet = require("helmet");
const { constants } = require("crypto");

var app = express();

let key = fs.readFileSync("TTRPAAPPF05.izzitelecom.net.key")
let cert = fs.readFileSync("TTRPAAPPF05.izzitelecom.net.crt")
var options = {
  key,
  cert,
													   
														
  secureOptions:
    constants.SSL_OP_NO_SSLv2 |
    constants.SSL_OP_NO_SSLv3 |
    constants.SSL_OP_NO_TLSv1 |
    constants.SSL_OP_NO_TLSv1_1,
};

app.use(helmet());
app.set("port", 4444);
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
    key: "cookie.sid",
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 3600000,
    },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(methodOverride());
app.use(serveStatic(path.join(__dirname, "public")));

require("./routes")(app);
  
																				
																	 
   
  

http
  .createServer(options, app)
  .listen(
    app.get("port"),
    // "172.21.137.79",
    function () 
    {
      console.log("Express server listening on port " + app.get("port"));
    }
  );
