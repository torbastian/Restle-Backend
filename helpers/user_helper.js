const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const { hash, encrypt } = require('./crypt');
const { TokenHandler } = require('./token_handler');

async function signUserToken(user, res) {

  try {
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);

    await TokenHandler(user._id, token);

    res.cookie('JWT', token, {
      maxAge: 86_400_800,
      httpOnly: true,
      sameSite: 'lax'
    }).send(getUserInfo(user));
  } catch (error) {
    console.log(error);
  }
}

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

function newUser(reqUser) {
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

  return user;
}

exports.newUser = newUser;
exports.getUserInfo = getUserInfo;
exports.signUserToken = signUserToken;