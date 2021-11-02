const Joi = require('joi');

function registerValidation(data) {
  const joiSchema = Joi.object({
    username: Joi.string().min(4).max(16).required(),
    password: Joi.string().min(6).max(40).required(),
    first_name: Joi.string().min(1).max(40).required(),
    last_name: Joi.string().min(1).max(40).required(),
    email: Joi.string().email(),
    colour: Joi.string().min(4).max(8)
  }).unknown();

  return joiSchema.validate(data);
}

exports.registerValidation = registerValidation;