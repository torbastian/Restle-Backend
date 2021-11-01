const { Schema, Mongoose } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var UserSchema = new Schema({
    user_id: Number,
    create_date: Date,
    username: String,
    email: String,
    password: String,
    first_name: String,
    last_name: String,
    colour: String,
    isAdmin: Boolean
});

//Compiled model

var UserModel = Mongoose.model('Users', UserSchema);