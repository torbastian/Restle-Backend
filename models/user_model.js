const mongoose = require('mongoose');

//Schemas
var UserSchema = new mongoose.Schema({
    create_date: {
        type: Date,
        default: Date.now
    },
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    first_name: {
        type: String,
        require: true
    },
    last_name: {
        type: String,
        require: true
    },
    colour: {
        type: String,
        default: "#FFF"
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});

//Compiled model

var UserModel = mongoose.model('Users', UserSchema);
module.exports = UserModel;