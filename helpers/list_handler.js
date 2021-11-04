const List = require("../models/list_model");

async function CreatList(board_id, title, cards = []){
    const newList = new List({
        board: board_id,
        title: title,
        cards = cards,
        created_date: Date.now(),
        last_edited: Date.now(),
    });

    try{
        newList.save().then(board => {
            return {
                success: true,
                message: "liste blev gemt",
                object: newList
            }
        }).catch(err =>{
            return {
                success: false,
                message: "liste blev ikke gemt"
            }
        });
    }catch(err){
        return {
            success: false,
            message: "liste blev ikke gemt. " + err
        }
    }
}

async function DeleteList(list_id){
    try{
        List.deleteOne({_id: list_id}).then(list => {
            return{
                success: true,
                message: "list blev slettet",
                object: list
            }
        }).catch( err =>{
            return{
                success: false,
                message: "liste blev ikke slettet. " + err
            }
        })
    }catch(err){
        return{
            success: false,
            message: "liste blev ikke slettet. " + err
        }
    }
    

}

async function EditList(list_id, title){
    try{
        List.updateOne({_id: list_id}, {title: title, last_edited: Date.now()}).then(list => {
            if(list.modifiedCount == 1){
                return {
                    success: true,
                    message: "listen blev updated",
                    object: list
                }
            }
        });
    }catch(err){
        return {
            success: false,
            message: "listen blev ikke updated"
        };
    }
}

async function AddCard(list_id, card_id){
    try{
        List.findOne({_id: list_id}).then(list => {
            if(list.cards.includes(card_id)){
                return{
                    success: false,
                    message: "Kortet er allerede på listen"
                }
            }
            list.push(card_id).save().then(saved => {
                return{
                    success: true,
                    message: "Kort er blevet tilføjet til liste",
                    object: saved
                }
            }).catch(err => {
                return{
                    success: false,
                    message: "Kort blec ikke tilføjet til liste. " + err
                }
            });
        });
    }catch(err){
        return{
            success: false,
            message: "bruger blev ikke medlem. " + err
        };
    }
}

async function RemoveCard(list_id, card_id){
    try{
        List.findOne({_id: list_id}).then(list => {
            if(!list.cards.includes(card_id)){
                return{
                    success: false,
                    message: "Kortet er ikke på listen"
                }
            }
            const index = list.cards.indexOf(card_id);

            list.cards.splice(card_id, 1).save().then(saved => {
                return{
                    success: true,
                    message: "Kort er blevet tilføjet til liste",
                    object: saved
                }
            }).catch(err => {
                return{
                    success: false,
                    message: "Kort blec ikke tilføjet til liste. " + err
                }
            });
        });
    }catch(err){
        return{
            success: false,
            message: "bruger blev ikke medlem. " + err
        };
    }
}

exports.CreatList = CreatList;
exports.DeleteList = DeleteList;
exports.EditList = EditList;
exports.AddCard = AddCard;
exports.RemoveCard = RemoveCard;