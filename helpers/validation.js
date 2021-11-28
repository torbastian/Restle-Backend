const Joi = require('joi');

function registerValidation(data) {
  const regex = new RegExp("^(?=.*[A-Z])(?=.*[!\"#¤%&()=?;:_*^'¨.,\\-\\/\\\\@£$€\\{\\[\\]\\}<>]).*$");

  console.log(regex.test(data.password))
  if (regex.test(data.password)) {
    const joiSchema = Joi.object({
      username: Joi.string().min(4).max(16).required(),
      password: Joi.string().min(8).max(40).required(),
      first_name: Joi.string().min(1).max(40).required(),
      last_name: Joi.string().min(1).max(40).required(),
      email: Joi.string().email(),
      colour: Joi.string().min(4).max(8)
    }).unknown();


    return joiSchema.validate(data);
  } else {
    return { error: { details: [{ message: "Password skal indeholde et stort bogstav og et speciel tegn" }] } }
  }
}

function updateValidation(data) {
  const joiSchema = Joi.object({
    first_name: Joi.string().min(1).max(40).required(),
    last_name: Joi.string().min(1).max(40).required(),
    colour: Joi.string().min(4).max(8)
  }).unknown();

  return joiSchema.validate(data);
}

function loginValidation(data) {
  const regex = new RegExp("^(?=.*[A-Z])(?=.*[!\"#¤%&()=?;:_*^'¨.,\\-\\/\\\\@£$€\\{\\[\\]\\}<>]).*$");

  if (regex.test(data.password)) {
    const joiSchema = Joi.object({
      username: Joi.string().min(4).max(16).required(),
      password: Joi.string().min(8).max(40).required()
    }).unknown();

    return joiSchema.validate(data);
  } else {
    return { error: { details: [{ message: "Password skal indeholde et stort bogstav og et speciel tegn" }] } }
  }

}

exports.registerValidation = registerValidation;
exports.loginValidation = loginValidation;
exports.updateValidation = updateValidation;