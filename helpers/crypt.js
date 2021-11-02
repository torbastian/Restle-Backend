const bcrypt = require('bcrypt');

function hash(string) {
  return bcrypt.hashSync(string, 10);
}

function encrypt(string) {
  console.log("ENCRYPT ER IKKE IMPLIMENTERET");
  return string;
}

function decrypt(string) {
  console.log("DECRYPT ER IKKE IMPLIMENTERET");
  return string;
}

exports.hash = hash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;