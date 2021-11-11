const Card = require("../models/card_model");
const List = require("../models/list_model");
const Lock = require("./lock_model");
const Board = require('../models/board_model');
const User = require('../models/user_model');
const { OwnerAdminValidator, MemberValidator } = require("./Permission_validator");

async function GetCards(board_id) {
    try {
        return Card.find({ board: board_id }).then(cards => {
            return {
                success: true,
                message: "Boardes kort blev fundet",
                object: cards
            }
        }).catch(err => {
            return {
                success: false,
                message: "Boardets kort blev ikke fundet. " + err
            }
        });
    } catch (err) {
        return {
            success: false,
            message: "Boardets kort blev ikke fundet. " + err
        }
    }
}

async function CreateCard(user_id, board_id, list_id, title, description, callback) {
    if (!MemberValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    if (title.length > 40) {
        return {
            success: false,
            message: "title er for lang, max 40 charatere"
        }
    }
    if (description.length > 1024) {
        return {
            success: false,
            message: "description er for lang, max 1024 charatere"
        }
    }

    const newCard = await new Card({
        board: board_id,
        list: list_id,
        created_date: Date.now(),
        last_edited: Date.now(),
        title: title,
        description: description,
        members: []
    });

    try {
        list = await List.findOne({ _id: list_id })
        Lock.LockModel(list,
            async function () {
                if(list){
                    await list.cards.push(newCard._id);
                    console.log("cards pushed");
                    await list.save();
                    await newCard.save();
                    console.log("list saved");
                    return true;
                } else {
                    return false;
                }
            },
            function (err, result) {
                if(err){
                    callback(err);
                }    
                if (newCard) {
                    callback({
                        success: true,
                        message: "Kort er blevet gemt",
                        object: newCard
                    });
                }
            });
    } catch (err) {
        callback({
            success: false,
            message: "Kort blev ikke gemt. " + err
        });
    }
}

async function DeleteCard(user_id, board_id, card_id, callback) {
    if(!MemberValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try {
        card = await Card.findOne({ _id: card_id });
        Lock.LockModel(card,
            function () {
                card.deleteOne();
                return true;
            },
            function(err, result){
                if(err){
                    callback(err);
                    return;
                }
                if(card){
                    callback({
                        success: true,
                        message: "Kort er blevet slettet",
                        object: card
                    });
                }
            });
    }catch(err){
        callback({
            success: false,
            message: "Korted blev ikke slettet. " + err
        });
    }
}

async function EditDescription(user_id, board_id, card_id, description, callback) {
    if(!MemberValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try{
        card = await Card.findOne({ _id: card_id });
        Lock.LockModel(card,
            function () {
                card.description = description;
                card.save();
            },
            function (err, result) {
                if(err){
                    callback(err);
                    return;
                }
                if(card){
                    callback({
                        success: true,
                        message: "Kort beskrivelse er blevet gemt",
                        object: card
                    });
                }
            }
        );
    }catch(err){
        callback({
            success: false,
            message: "Kort beskrivelse blev ikke gemt. " + err
        });
    }
}

async function AddMember(user_id, board_id, card_id, member_id, callback) {
    if (!OwnerAdminValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    card = await Card.findOne({ _id: card_id });
    Lock.LockModel(card,
    function () {
        if (!card.members.includes(member_id)) {
            card.members.push(member_id);
            card.save();
            return true;
        }
    },
    function (err, result) {
        if(err){
            callback(err);
            return;
        }
        if(result){
            callback({
                success: true,
                message: "Kort er blevet gemt",
                object: result
            });
        }
    });
}

async function RemoveMember(user_id, board_id, card_id, member_id, callback) {
    if (!OwnerAdminValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try{
        card = await Card.findOne({ _id: card_id });
        console.log("CARD! " + card);
        result = Lock.LockModel(card,
        function () {
            if(card.members.includes(member_id)) {
                    const index = card.members.indexOf(member_id);
                    card.members.splice(index, 1);
                    card.save();
                    return true;
                }
            },
            function (err, result) {
                if(err){
                    callback(err);
                }
                if (card) {
                    callback({
                        success: true,
                        message: "Kort medlem er blevet fjernet",
                        object: card
                    });
                }
            }
        );
    }catch(err){
        callback({
            success:false,
            message: "noget gik galt da vi forsøgte at fjerne medlem fra kort. " + err 
        });
    }   
}

exports.CreateCard = CreateCard;
exports.DeleteCard = DeleteCard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.EditDescription = EditDescription;
exports.GetCards = GetCards;