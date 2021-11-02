const router = require('express').Router();
const { hash, compare, encrypt, decrypt } = require('../helpers/crypt');
const User = require('../models/user_model');
const jwt = require('jsonwebtoken');
const { reqToUser } = require('../helpers/req_converter');
const { registerValidation, loginValidation } = require('../helpers/validation');
const verify = require('./token-validator');

router.post('/register', async (req, res) => {
  const reqUser = reqToUser(req);

  const { error } = registerValidation(reqUser);
  if (error) return res.status(400).send({ message: error.details[0].message });

  //Se om en bruger med det valgte brugernavn findes i databasen
  const usernameExists = await User.findOne({ username: reqUser.username });
  if (usernameExists) return res.status(400).send({ message: 'Username in use' });

  //Hash og salt password
  const hashedPassword = hash(reqUser.password);

  //Opret bruger
  const user = new User({
    username: reqUser.username,
    password: hashedPassword,
    first_name: reqUser.first_name,
    last_name: encrypt(reqUser.last_name),
    email: reqUser.email,
    colour: reqUser.colour
  });

  try {
    //Hvis brugeren bliver oprettet
    //Send en token med tilbage
    await user.save().then(savedUser => {
      const token = jwt.sign({ _id: savedUser._id }, process.env.TOKEN_SECRET);
      res.cookie('JWT', token, {
        maxAge: 86_400_800,
        httpOnly: true,
        sameSite: 'lax'
      }).send(getUserInfo(user));
    })
  } catch (err) {
    res.status(400).send(err);
  }
});

function getUserInfo(user) {
  return JSON.stringify({
    _id: user._id,
    username: user.username,
    create_date: user.create_date,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    isAdmin: user.isAdmin
  })
}


//Login
router.post('/login', async (req, res) => {

  //Checker om brugerens credentials er valid
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  //Gemmer brugeren med det indtastet brugernavn
  const user = await User.findOne({username: req.body.username});
  
  //Udskriver fejl hvis brugeren ikke findes
  if (user == null) {
    return res.status(400).send('Cannot find user')
  }

  try {
    //Hvis brugeren har indtastet deres password korrekt får de angivet et JSON web token.
    if(compare(req.body.password, user.password))
    {
      const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
      res.cookie('JWT', token, {
        maxAge: 86_400_800,
        httpOnly: true,
        sameSite: 'lax'
      }).send(getUserInfo(user));
    }
    //Hvis brugeren har indtastet deres password forkert
    else
    {
      res.send('Not allowed')
    }
  }
  //Catch status ved fejl
  catch{
    res.status(500).send
  }
});

//Simpel logout der sletter brugerens Json web token.
router.get('/logout', async (req, res) => {
  res.clearCookie('JWT').send();
});



module.exports = router;