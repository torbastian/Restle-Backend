const bcrypt = require('bcrypt');

function hash(string) {
  return bcrypt.hashSync(string, 10);
}

exports.hash = hash;