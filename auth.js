


const passport = require('passport');
const { loginload } = require('./controller/userController');
// const bcrypt=require('bcrypt')

require('dotenv').config()

//Google signup

var GoogleStrategy = require('passport-google-oauth2').Strategy;
passport.use(new GoogleStrategy({
  clientID:'818271103699-cblimt996dfr0lqt10k00lcdt49vj12h.apps.googleusercontent.com ',
  clientSecret:'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',
  callbackURL: "https://localhost:3040/google/callback",
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