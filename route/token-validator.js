const jwt = require('jsonwebtoken');

//validere en token ud fra en request cookie
function validateToken(req, res, next) {
  const token = req.cookies.JWT;
  if (!token) return res.status(401).send({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;

    next();
  } catch (err) {
    res.status(400).send({ message: 'Invalid token' });
  }
}

module.exports = validateToken;