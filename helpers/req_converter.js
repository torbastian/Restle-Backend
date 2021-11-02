function reqToUser(req) {
  const user = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    colour: req.body.colour,
    isAdmin: req.body.isAdmin
  };

  return user;
}

exports.reqToUser = reqToUser;