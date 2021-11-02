const mongoose = require('mongoose');

//Schemas
var UserSchema = new mongoose.Schema({
    create_date: {
        Date,
        default: now()
    },
    username: {
        String,
        require: true
    },
    email: {
        String,
        require: true
    },
    password: {
        String,
        require: true
    },
    first_name: {
        String,
        require: true
    },
    last_name: {
        String,
        require: true
    },
    colour: {
        String,
        default: "#FFF"
    },
    isAdmin: {
        Boolean,
        default: false
    }
});

//Compiled model

var UserModel = mongoose.model('Users', UserSchema);
module.exports = UserModel;