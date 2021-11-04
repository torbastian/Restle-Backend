const Card = require("../models/card_model");

async function GetCards(board_id){
    try{
        Card.find({board: board_id}).then(cards =>{
            return{
                success: true,
                message: "Boardes kort blev fundet",
                object: cards
            }
        }).catch(err => {
            return{
                success: false,
                message: "Boardets kort blev ikke fundet. " + err
            }
        });
    }catch(err){
        return{
            success: false,
            message: "Boardets kort blev ikke fundet. " + err
        }
    }
}

async function CreateCard(board_id, title, description, members = []){

    const newCard = new Card({
        board: board_id,
        created_date: Date.now(),
        last_edited: Date.now(),
        title: title,
        description: description,
        members: members
    });

    try{
        newCard.save().then(card =>{
            return{
                success: true,
                message: "Kort er blevet gemt",
                object: card
            }
        }).catch(err => {
            return{
                success: false,
                message: "Kort blev ikke gemt. " + err
            }
        });
    }catch(err){
        return{
            success: false,
            message: "Kort blev ikke gemt. " + err
        }
    }
}

async function DeleteCard(card_id){
    try{
        Card.deleteOne({_id: card_id}).then(card => {
            return{
                success: true,
                message: "Kort blev slettet",
                object: card
            }
        }).catch(err => {
            return{
                success: false,
                message: "Kort blev ikke slettet. " + err
            }
        });
    }catch(err){
        return{

        }
    }
}

exports.CreateCard = CreateCard;
exports.DeleteCard = DeleteCard;
exports.GetCards = GetCards;