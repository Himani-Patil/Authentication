//jshint esversion:6
require("dotenv").config();
const exp = require("express");
const bdp = require("body-parser");
const ejs = require("ejs");

const app = exp();

app.use(exp.static("public"));
app.use(bdp.urlencoded({extended: true}));
app.set('view engine','ejs');

app.get("/",function(req,res){
    res.render("home");
});

app.get('/login',function(req,res){
    res.render('login');
});

app.get('/register',function(req,res){
    res.render('register');
});

//connection with databse
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/SecretsDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    pass: String
});

///////////////////////// - encryption
// const encrypt = require("mongoose-encryption");
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['pass']});
/////////////////////////

///////////////////////// - Hashing
// const md5 = require("md5");
/////////////////////////

///////////////////////// - Salting & Hashing
const bcrypt = require("bcrypt");
const saltRounds = 2;
/////////////////////////


const User = new mongoose.model("User", userSchema);

app.post("/register", function(req, res){
    
    bcrypt.hash(req.body.password, saltRounds, function(err, hash){

        const newUser = new User({
            email: req.body.username, 
            pass: hash
        });
    
        newUser.save();
        res.render('secrets');
    });
});

///////////////////////// - login

app.post("/login",function(req,res){
    let username = req.body.username;
    let password = req.body.password;

    User.findOne({email: username})
    .then(function(foundUser){
        bcrypt.compare(password, foundUser.pass, function(err, result){
            if(result){
                res.render('secrets');
            }
            else
            {
                res.send("<h1>Wrong username or Passward!</h1>");
            }
        });
    })
    .catch(function(err){
        console.log(err);
    });
});

/////////////////////////

app.get("/logout", function(req,res){
    res.render('home');
});

/////////////////////////

app.listen(3000, function(){
    console.log('Server started on port 3000....');
});