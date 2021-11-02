const router = require('express').Router();
const { hash, encrypt, decrypt } = require('../helpers/crypt');
const User = require('../models/user_model');
const jwt = require('jsonwebtoken');
const { reqToUser } = require('../helpers/req_converter');
const mongoose = require('mongoose');

router.post('/register', async (req, res) => {
  //userRegisterValidation()

  const reqUser = reqToUser(req);

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

module.exports = router;