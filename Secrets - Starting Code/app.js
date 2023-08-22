//jshint esversion:6
require("dotenv").config();
const exp = require("express");
const bdp = require("body-parser");
const ejs = require("ejs");

const app = exp();
 
app.use(exp.static("public"));
app.use(bdp.urlencoded({extended: true}));
app.set('view engine','ejs');

///////////////////////// - using cookies

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

///////////////////////// - connection with databse
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/SecretsDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    pass: String,
    googleId: String,
    secret: String
});

///////////////////////// - using cookies

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
//   User.findById(id, function(err, user) {
//     done(err, user);
//   });
  User.findById(id)
  .then(function(user){
    done(null,user);
  })
  .catch(function(err){});
});
  
///////////////////////// - using google OAuth

const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
    passport.authenticate("google",{scope: ["profile"]})
);

app.get("/auth/google/secrets",
    passport.authenticate("google",{failureRedirect: "/login"}),
    function(req,res){
        res.redirect("/secrets");
    }
);

/////////////////////////

app.get("/",function(req,res){
    res.render("home");
});

app.get('/login',function(req,res){
    res.render('login');
});

app.get('/register',function(req,res){
    res.render('register');
});

///////////////////////// - using cookies

app.get('/secrets',function(req,res){
    User.find({"secret":{$ne:null}})
    .then(function(foundUsers){
        res.render("secrets", {userSecrets: foundUsers});
    })
    .catch(function(err){
        console.log(err);
    });
});

///////////////////////// - encryption
// const encrypt = require("mongoose-encryption");
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['pass']});
/////////////////////////

///////////////////////// - Hashing
// const md5 = require("md5");
/////////////////////////

///////////////////////// - Salting & Hashing
// const bcrypt = require("bcrypt");
// const saltRounds = 2;
/////////////////////////

///////////////////////// - register

app.post("/register", function(req, res){
    
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else {
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets');
            });
        }
    });
});

///////////////////////// - login

app.post('/login', passport.authenticate('local', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
  }));

/////////////////////////

app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    });
});

///////////////////////// - Submit a secret
app.get("/submit", function(req, res){
    res.render('submit');
});

app.post("/submit", function(req, res){
    var secret = req.body.secret;
    console.log(req);

    User.findById(req.user._id)
    .then(function(foundUser){
        if(foundUser){
            foundUser.secret=secret;
            foundUser.save();
            res.redirect('/secrets');
        }
    })
    .catch(function(err){
        console.log(err);
    });
});
/////////////////////////

app.listen(3000, function(){
    console.log('Server started on port 3000....');
});