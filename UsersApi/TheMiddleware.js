const jwt = require("jsonwebtoken");
require('dotenv').config();
const secret = process.env.JWT_SECRET; // Use environment variable or a default value

function Generatetoken(email) {
  const token = jwt.sign({ email }, secret, { expiresIn: "1h" });
  return token;
}

async function Authenticator(req, res, next) {
  if (req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer")) {
      const token = req.headers.authorization.split(" ")[1];
      if (token == null) {
        return res.send({ message: "unauthorized" });
      }
      try {
        const decode = jwt.verify(token, secret);
        if (decode) {
          req.data = decode;
       
          next();
        }
      } catch (err) {
        return res.send({ message: "unauthorized" });
      }
    } else {
      return res.send({ message: "unauthorized" });
    }
  } else {
    return res.send({ message: "unauthorized" });
  }
}

module.exports = { Authenticator, Generatetoken };