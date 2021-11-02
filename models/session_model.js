const mongoose = require("mongoose");

//Schemas
var SessionSchema = new mongoose.Schema({
    user: {
        user: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
        require: true
    },
    token: {
        String,
        require: true
    }
});

//Compiled model

var SessionModel = mongoose.model('Sessions', SessionSchema);
module.exports = SessionModel;