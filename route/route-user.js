const router = require('express').Router();
const { hash, compare, encrypt, decrypt } = require('../helpers/crypt');
const User = require('../models/user_model');
const Reset = require('../models/reset_password_model');
const jwt = require('jsonwebtoken');
const { reqToUser } = require('../helpers/req_converter');
const { isAdmin, AdminValidator } = require("../helpers/Permission_validator");
const { registerValidation, loginValidation, updateValidation } = require('../helpers/validation');
const { signUserToken, newUser, getUserInfo, DeleteUser } = require('../helpers/user_helper');
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
  const emailExists = await User.findOne({ email: reqUser.email });
  if (usernameExists) return res.status(400).send({ message: 'Username in use' });
  if (emailExists) return res.status(400).send({ message: 'email in use' });

  //Opret en ny bruger
  const user = newUser(reqUser);

  try {
    //Brugeren bliver gemt
    await user.save();
    res.status(200).send();
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
  console.log('Req body', req.body);

  const userUpdate = {
    first_name: req.body.first_name,
    colour: req.body.colour,
    last_name: req.body.last_name
  }

  const { error } = updateValidation(userUpdate);
  if (error) return res.status(400).send({ message: error.details[0].message });

  user.first_name = req.body.first_name;
  user.colour = req.body.colour;
  if(user.last_name){
    user.last_name = encrypt(req.body.last_name);
  }
  

  if (req.body.password != null) {

    if ((!compare(req.body.password, user.password))) {
      return res.status(400).send({ message: 'Fokert password' });
    }

    console.log("TESTEST")
    const { error } = loginValidation({ username: user.username, password: req.body.new_password });
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }
    console.log("TESTEST2")

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

  const verifyAdmin = await AdminValidator(req.user._id);
  if (!verifyAdmin) return res.status(400).send({ message: 'Permission denied: User isn\'t an admin' });

  if (req.user._id != req.body.userid) {
    const user = await User.findById(req.body.userId);

    const userUpdate = {
      first_name: req.body.first_name,
      colour: req.body.colour,
      last_name: req.body.last_name
    }

    const { error } = updateValidation(userUpdate);
  if (error) return res.status(400).send({ message: error.details[0].message });

    user.first_name = req.body.first_name;
    user.colour = req.body.colour;
    user.last_name = encrypt(req.body.last_name);
    user.isAdmin = req.body.isAdmin;


    if (req.body.new_password != null) {
      
      const { error } = loginValidation({ username: user.username, password: req.body.new_password });
      if (error) {
        return res.status(400).send({ message: error.details[0].message });
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
  } else {
    res.status(400).send("Kan ikke redigere admin rettigheder på sig selv");
  }


});

//Delete user
router.delete('/:userId', ValidateToken, async (req, res) => {
  const userToDelete = await User.findById(req.params.userId);
  const admin = await AdminValidator(req.user._id)
  if (userToDelete._id != req.user._id && !admin) {
    return res.status(400).send({ message: 'Denied' });
  }
  else {
    DeleteUser(userToDelete._id, function (result) {
    });
    //userToDelete.deleteOne();
    if (!admin) {
      return res.clearCookie('JWT').send();
    }
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
  users = await User.find({ $or: [{ first_name: { $regex: '.*' + req.query.search + '.*', $options: 'i' } }, { email: { $regex: '.*' + req.query.search + '.*', $options: 'i' } }] }
    , ['_id', 'first_name', 'last_name', 'email', 'colour', 'isAdmin']);

  users.forEach(function (user) {
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


  users.forEach(function (user) {
    user.last_name = decrypt(user.last_name);
  });


  if (!users) {
    return res.status(400).send({ message: "no useres found" })
  } else {
    return res.status(200).send({ users });
  }
});

router.post('/resetPassword', async (req, res) => {
  const email = req.body.email;

  if (email) {
    const user = await User.findOne({ email: email });

    if (user) {
      resetExist = await Reset.findOne({ user: user._id });
      if (resetExist) {
        await resetExist.deleteOne();
      }

      const token = Crypto.randomBytes(48).toString('hex');
      const expiration = new Date();
      const minuts = expiration.getMinutes();
      expiration.setMinutes(minuts + 20);
      const reset = new Reset({
        user: user._id,
        key: token,
        expiration: expiration
      });
      reset.save();

      const link = "localhost:3000/resetPassword/" + token;
      SendEmailReset(email, link);

    }
  }
});

router.post('/PasswordReset', async (req, res) => {
  const token = req.body.token;
  const _password = hash(req.body.password);

  const tokenObject = await Reset.findOne({ key: token });
  if (tokenObject) {
    const user = await User.findOne({ _id: tokenObject.user });

    const newUser = {
      username: user.username,
      password: req.body.password
    };

    const { error } = loginValidation(newUser);
    if (error) return res.status(400).send({ message: error.details[0].message });

    if (user) {
      user.password = _password;
      user.save();
      return res.status(200).send();
    }
  }
});

router.post('/checkToken', async (req, res) => {
  const token = req.body.token;

  if (token) {
    const confirmToken = await Reset.findOne({ key: token });

    if (confirmToken) {
      if (confirmToken.expiration < Date.now()) {
        res.status(400).send("token er forældet");
      }
      res.status(200).send("token findes");
    } else {
      res.status(400).send("token findes ikke");
    }
  } else {
    res.status(400).send("bad request");
  }
});


module.exports = router;