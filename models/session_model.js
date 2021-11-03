const mongoose = require("mongoose");

//Schemas
var SessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
        require: true
    },
    token: {
        type: String,
        require: true
    }
});

//Compiled model
var SessionModel = mongoose.model('Sessions', SessionSchema);
module.exports = SessionModel;