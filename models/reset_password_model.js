const mongoose = require("mongoose");

//Schemas
var ResetPasswordShema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
        require: true
    },
    key: {
        type: String,
        require: true
    }
});

//Compiled model
var ResetPasswordModel = mongoose.model('ResetPassword', ResetPasswordShema);
module.exports = ResetPasswordModel;