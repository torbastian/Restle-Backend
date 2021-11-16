const bcrypt = require('bcrypt');

function hash(string) {
  return bcrypt.hashSync(string, 10);
}

function compare(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword)
}

function encrypt(string) {
  return string;
}

function decrypt(string) {
  return string;
}

exports.hash = hash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.compare = compare;