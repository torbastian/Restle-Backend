const { Schema, Mongoose, now } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var UserSchema = new Schema({
    create_date: Date,
    default:now(),
    username: String,
    require: true,
    email: String,
    require: true,
    password: String,
    require: true,
    first_name: String,
    require: true,
    last_name: String,
    require: true,
    colour: String,
    default:"#FFF",
    isAdmin: Boolean,
    default:false
});

//Compiled model

var UserModel = Mongoose.model('Users', UserSchema);