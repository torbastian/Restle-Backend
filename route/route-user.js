const router = require('express').Router();
const { hash, compare, encrypt, decrypt } = require('../helpers/crypt');
const User = require('../models/user_model');
const jwt = require('jsonwebtoken');
const { reqToUser } = require('../helpers/req_converter');
const { registerValidation, loginValidation } = require('../helpers/validation');
const { signUserToken, newUser } = require('../helpers/user_helper');
const SessionModel = require('../models/session_model');

router.post('/register', async (req, res) => {
  const reqUser = reqToUser(req);

  //Valider om brugerens indtastede felter er valid
  const { error } = registerValidation(reqUser);
  if (error) return res.status(400).send({ message: error.details[0].message });

  //Se om en bruger med det valgte brugernavn findes i databasen
  const usernameExists = await User.findOne({ username: reqUser.username });
  if (usernameExists) return res.status(400).send({ message: 'Username in use' });

  //Opret en ny bruger
  const user = newUser(reqUser);

  try {
    //Hvis brugern bliver gemt
    //Send en token med tilbage
    await user.save().then(savedUser => {
      signUserToken(savedUser, res);
    })
  } catch (err) {
    res.status(400).send(err);
  }
});

//Login
router.post('/login', async (req, res) => {

  //Checker om brugerens credentials er valid
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  //Gemmer brugeren med det indtastet brugernavn
  const user = await User.findOne({ username: req.body.username });

  //Udskriver fejl hvis brugeren ikke findes
  if (user == null) {
    return res.status(400).send({message: "Username or password is invalid"});
  }

  try {
    //Hvis brugeren har indtastet deres password korrekt får de angivet et JSON web token.
    if (compare(req.body.password, user.password)) {
      signUserToken(user, res);
    }
    //Hvis brugeren har indtastet deres password forkert
    else {
      res.status(400).send({message: "Username or password is invalid"});
    }
  }
  //Catch status ved fejl
  catch {
    res.status(500).send();
  }
});

//Simpel logout der sletter brugerens Json web token.
router.get('/logout', async (req, res) => {
  res.clearCookie('JWT').send();
});

module.exports = router;