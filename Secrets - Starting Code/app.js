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
    pass: String
});

///////////////////////// - using cookies

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
    if(req.isAuthenticated()){
        res.render('secrets');
    }
    else {
        res.redirect('/login');
    }
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

/////////////////////////

app.listen(3000, function(){
    console.log('Server started on port 3000....');
});