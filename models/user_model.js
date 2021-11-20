const lockRelease = require('mongoose-lock-release');
const Lock = require("../helpers/lock_model");
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

//plugins
UserSchema.plugin(lockRelease, 'Lists');

//Compiled model

var UserModel = mongoose.model('Users', UserSchema);
module.exports = UserModel;