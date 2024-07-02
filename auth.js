


const passport = require('passport');
const { loginload } = require('./controller/userController');
require('dotenv').config()

//Google signup

var GoogleStrategy = require('passport-google-oauth2').Strategy;
passport.use(new GoogleStrategy({
  clientID:'574667909467-6sffbjo2m8ju2e6gb10i55uhs8rp4re8.apps.googleusercontent.com',
  clientSecret:'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',
  callbackURL: "http://localhost:3040/authentication/google/callback",
  passReqToCallback:true
},
    function (request, accessToken, refreshToken, profile, done) {
       return done(null, profile);
    }
)
);

passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user);
})