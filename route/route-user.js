const router = require('express').Router();
const { hash, compare, encrypt, decrypt } = require('../helpers/crypt');
const User = require('../models/user_model');
const Reset = require('../models/reset_password_model');
const jwt = require('jsonwebtoken');
const { reqToUser } = require('../helpers/req_converter');
const { registerValidation, loginValidation } = require('../helpers/validation');
const { signUserToken, newUser, getUserInfo } = require('../helpers/user_helper');
const { ValidateToken } = require('../helpers/token_handler');
const { SendEmailReset } = require('../helpers/mail_handler');

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
    return res.status(400).send({ message: "Username or password is invalid" });
  }

  try {
    //Hvis brugeren har indtastet deres password korrekt får de angivet et JSON web token.
    if (compare(req.body.password, user.password)) {
      signUserToken(user, res);
    }
    //Hvis brugeren har indtastet deres password forkert
    else {
      res.status(400).send({ message: "Username or password is invalid" });
    }
  }
  //Catch status ved fejl
  catch {
    res.status(500).send();
  }
});

//Get user?
router.get('/', ValidateToken, async (req, res) => {
  await User.findById(req.user._id).then((user, err) => {
    if (!err) {
      res.status(200).send(getUserInfo(user))
    } else {
      res.status(400).send({ message: 'User not found' });
    }
  });
});


//Update user
router.post('/update', ValidateToken, async (req, res) => {
  const user = await User.findById(req.user._id)
  user.first_name = req.body.first_name;
  user.colour = req.body.colour;
  user.last_name = req.body.last_name;
  const { registerError } = registerValidation(user);
  if (registerError) return res.status(400).send({ message: error.details[0].message });
  user.last_name = encrypt(user.last_name);

  if (req.body.password != null) {

    if ((!compare(req.body.password, user.password))) {
      return res.status(400).send({ message: 'Wrong password' });
    }


    /* Kunne ikke lave en password validation der virkede, pls hjælp tor D: */
    const { error } = loginValidation({ username: user.username, password: req.body.new_password });
    if (error) {
      return res.status(400).send({ message: error });
    }

    const hashedPassword = hash(req.body.new_password);
    user.password = hashedPassword;
  }

  try {
    user.save().then(updateUser => {
      if (updateUser == user) {
        res.status(200).send(getUserInfo(user));
      }
    });
  } catch (err) {
    res.status(400).send(err);
  }

});

//Delete user
router.delete('/:userId', ValidateToken, async (req, res) => {
  const userToDelete = await User.findById(req.params.userId);
  if (userToDelete._id != req.user._id) {
    return res.status(400).send({ message: 'Denied' });
  }
  else {
    userToDelete.deleteOne();
    return res.clearCookie('JWT').send();
  }
});

//Simpel logout der sletter brugerens Json web token.
router.get('/logout', async (req, res) => {
  res.clearCookie('JWT').send();
});

router.post('/AdminOverview', ValidateToken, async (req, res) => {
  // GET DATA!
});

router.get('/findUser', ValidateToken, async (req, res) => {
  users = await User.find({ $or: [{ first_name: { $regex: '.*' + req.query.search + '.*', $options: 'i' }}, { email: { $regex: '.*' + req.query.search + '.*', $options: 'i' } }] }
    , ['_id', 'first_name', 'last_name', 'email', 'colour']);

  if (!users) {
    return res.status(400).send({ message: "no useres found" })
  } else {
    return res.status(200).send(users);
  }
});

router.get('/getUsers', ValidateToken, async (req, res) => {
  users = await User.find().limit(50);

  if (!users) {
    return res.status(400).send({ message: "no useres found" })
  } else {
    return res.status(200).send({users});
  }
});

router.post('/resetPassword', async (req, res) => {
  const email = req.user.email;
  if(email){

    SendEmailReset(email, );
  }
});


module.exports = router;