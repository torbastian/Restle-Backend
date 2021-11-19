const router = require('express').Router();
const { hash, compare, encrypt, decrypt } = require('../helpers/crypt');
const User = require('../models/user_model');
const Reset = require('../models/reset_password_model');
const jwt = require('jsonwebtoken');
const { reqToUser } = require('../helpers/req_converter');
const { isAdmin } = require("../helpers/Permission_validator");
const { registerValidation, loginValidation } = require('../helpers/validation');
const { signUserToken, newUser, getUserInfo } = require('../helpers/user_helper');
const { ValidateToken } = require('../helpers/token_handler');
const { SendEmailReset } = require('../helpers/mail_handler');
const Crypto = require('crypto');

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

//Get user
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

//Update user as admin
router.post('/admin/update', ValidateToken, async (req, res) => {
  const verifyAdmin = await isAdmin(req.user._id);
  if (!verifyAdmin) return res.status(400).send({ message: 'Permission denied: User isn\'t an admin' });

  const user = await User.findById(req.body.userId);
  user.first_name = req.body.first_name;
  user.colour = req.body.colour;
  user.last_name = req.body.last_name;
  user.isAdmin = req.body.isAdmin;
  const { registerError } = registerValidation(user);
  if (registerError) return res.status(400).send({ message: error.details[0].message });
  user.last_name = encrypt(user.last_name);

  if (req.body.new_password != null) {

    const { error } = loginValidation({ username: user.username, password: req.body.new_password });
    if (error) {
      return res.status(400).send({ message: error });
    }

    console.log(req.body.new_password);

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
  console.log(req.params.userId);
  console.log(req.user._id);
  const userToDelete = await User.findById(req.params.userId);
  const admin = await isAdmin(req.user._id)
  if (userToDelete._id != req.user._id && !admin) {
    return res.status(400).send({ message: 'Denied' });
  }
  else {
    userToDelete.deleteOne();
    if(!admin){
    return res.clearCookie('JWT').send();
    }
  }
});

//Simpel logout der sletter brugerens Json web token.
router.get('/logout', async (req, res) => {
  console.log("TESTESTEST0");
  res.clearCookie('JWT').send();
});

router.post('/AdminOverview', ValidateToken, async (req, res) => {
  // GET DATA!
});

router.get('/findUser', ValidateToken, async (req, res) => {
  users = await User.find({ $or: [{ first_name: { $regex: '.*' + req.query.search + '.*', $options: 'i' }}, { email: { $regex: '.*' + req.query.search + '.*', $options: 'i' } }] }
    , ['_id', 'first_name', 'last_name', 'email', 'colour', 'isAdmin']);

    users.forEach(function(user) {
      user.last_name = decrypt(user.last_name);
  });

  if (!users) {
    return res.status(400).send({ message: "no useres found" })
  } else {
    return res.status(200).send(users);
  }
});

router.get('/getUsers', ValidateToken, async (req, res) => {
  users = await User.find().limit(50);
 

  users.forEach(function(user) {
    user.last_name = decrypt(user.last_name);
});


  if (!users) {
    return res.status(400).send({ message: "no useres found" })
  } else {
    return res.status(200).send({users});
  }
});

router.post('/resetPassword', async (req, res) => {
  console.log("HEJ");
  const email = req.body.email;
  console.log("email ", email);

  if(email){
    const user = await User.findOne({email: email});

    if(user){
      resetExist = await Reset.findOne({user: user._id});
      if(resetExist){
        await resetExist.deleteOne();
      }

      const token = Crypto.randomBytes(48).toString('hex');
      const reset = new Reset({
        user: user._id,
        key: token
      });
      reset.save();

      const link = "localhost:3000/resetPassword/" + token;
      SendEmailReset(email, link);

    }
  }
});

router.post('/PasswordReset', async (req, res) =>{
  const token = req.body.token;
  console.log(req.body.password);
  const _password = hash(req.body.password);

  const tokenObject = await Reset.findOne({key: token});
  if(tokenObject){
    const user = await User.findOne({_id: tokenObject.user});

    const newUser = {
      username: user.username,
      password: req.body.password
    };

    const { registerError } = loginValidation(newUser);
    if (registerError) return res.status(400).send({ message: error.details[0].message });

    if(user){
      user.password = _password;
      user.save();
    }
  }
});

router.post('/checkToken', async (req, res) => {
  const token = req.body.token;

  if(token){
    const confirmToken = await Reset.findOne({key: token});
    if(confirmToken){
      res.status(200).send("token findes");
    }else{
      res.status(400).send("token findes ikke");
    }
  }else{
    res.status(400).send("bad request");
  }
});


module.exports = router;