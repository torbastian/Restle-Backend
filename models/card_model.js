const mongoose = require("mongoose");
const List = require("../models/list_model");
const Board = require("../models/board_model");
const lockRelease = require('mongoose-lock-release');
const Lock = require("../helpers/lock_model");

//Schemas
var CardSchema = new mongoose.Schema({
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boards",
        require: true
    },
    list:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Lists",
        require: true
    },
    create_date: {
        type: Date,
        default: Date.now
    },
    last_edited: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        require: true
    },
    description: String,

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }]
});

//plugins
CardSchema.plugin(lockRelease, 'Cards');

//pre
CardSchema.pre('save', { document : true }, async function() {
    this.last_edited = Date.now();
  });

CardSchema.pre('deleteOne', { document : true }, async function() {
    /*if(this.locked){
        this.lock(5000, function(err, cardItem){});

        this.release(function(err, cardItem){});
    }*/
});
//Compiled model
const CardModel = mongoose.model('Cards', CardSchema);
module.exports = CardModel;