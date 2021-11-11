const List = require("../models/list_model");

async function GetLists(board_id){
    try{
        return List.find({board: board_id}).then(lists => {
            return{
                success: true,
                message: "boardeds lister blev fundet",
                object: lists
            }
        }).catch(err => {
            return{
                success: false,
                message: "Kunne ikke hente lister. " + err
            }
        });
    }catch(err){
        return{
            success: false,
            message: "Kunne ikke hente lister. " + err
        }
    }
}

async function CreateList( user_id, board_id, title, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan tilføje lister"
        });
        return;
    }
    if(title.length > 40){
        callback({
            success: false,
            message: "title er for lang, max 40 charatere"
        });
        return;
    }

    const newList = new List({
        board: board_id,
        title: title,
        cards: [],
        created_date: Date.now(),
        last_edited: Date.now(),
    });

    try{
        await newList.save();
        board = await Board.findOne({_id: board_id});
        result = Lock.LockModel(board, 
        function(){
            if(!board.lists.includes(newList._id)){
                board.lists.push(newList._id);
                board.save();
                return true;
            }
        },
        function(err, result){
            if(newList){
                callback({
                    success: true,
                    message: "Liste blev slettet",
                    object: newList});
            }                
        });
    }catch(err){
        callback({
            success: false,
            message: "liste blev ikke gemt. " + err
        });
    }
}

async function DeleteList(user_id, board_id, list_id, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan slette lister"
        });
        return;
    }
    try{
        list = await List.findOne({_id: list_id});
        result = Lock.LockModel(card, 
        function(){
            list.title = title;
            list.save();
            return true;
        },
        function(err, result){
            if(card){
                callback({
                    success: true,
                    message: "Liste blev slettet",
                    object: list
                });
            }                
        });
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
    }catch(err){
        return{
            success: false,
            message: "liste blev ikke slettet. " + err
        }
    }
}

async function EditTitle(user_id, board_id, list_id, title, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan redigere liste title"
        });
        return;
    }
    if(title.length > 40){
        callback({
            success: false,
            message: "title er for lang, max 40 charatere"
        });
        return;
    }
    try{
        list = await List.findOne({_id: list_id});
        result = Lock.LockModel(card, 
        function(){
            list.title = title;
            list.save();
            return true;
        },
        function(err, result){
            if(card){
                callback({
                    success: true,
                    message: "Liste title er blivet ændret til " + title,
                    object: list
                });
            }                
        });
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
    }catch(err){
        return {
            success: false,
            message: "liste title blev ikke ændret. " + err
        };
    }
}

async function AddCard(user_id, board_id, list_id, card_id, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan tilføje kort til listen"
        });
        return;
    }
    try{
        list = await List.findOne({_id: list_id});
        result = Lock.LockModel(list, 
        function(){
            if(list.cards.includes(card_id)){
                if(!list.cards.includes(card_id)){
                    list.cards.push(card_id);
                    list.save();
                    return true;
                }
            }
        },
        async function(err, result){
            if(list){
                card = await Card.findOne({_id: card_id});
                result = Lock.LockModel(card, 
                function(){
                    card.list = list_id;
                    card.save();
                    return true;
                },
                function(err, result){
                    if(card){
                        callback({
                            success: true,
                            message: "Kort er blevet tilføjet til liste",
                            object: list});
                    }                
                });
            }                
        });
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
    }catch(err){
        return{
            success: false,
            message: "Kort blev ikke tilføjet til liste. " + err
        };
    }
}

async function RemoveCard(user_id, board_id, list_id, card_id, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try{
        list = await List.findOne({_id: list_id});
        result = Lock.LockModel(list, 
        function(){
            if(list.cards.includes(card_id)){
                const index = list.cards.indexOf(card_id);
                list.cards.splice(index, 1);
                list.save();
                return true;
            }
        },
        async function(err, result){
            if(list){
                card = await Card.findOne({_id: card_id});
                result = Lock.LockModel(card, 
                function(){
                    card.list = undefined;
                    card.save();
                    return true;
                },
                function(err, result){
                    if(card){
                        callback({
                            success: true,
                            message: "Kortet blev fjernet fra listen",
                            object: list
                        });
                    }                
                });
            }                
        });
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
    }catch(err){
        return{
            success: false,
            message: "Kortet blev ikke fjernet fra listen. " + err
        };
    }
}

function OwnerAdminValidator(user_id, board_id){
    try{
        const board = Board.findOne({_id: board_id});
        const user = User.findOne({_id: user_id});
    
        if(user.isAdmin || user_id == board.owner){
            return true;
        }else{
            return false;
        }
    }catch(err){
        throw new Error("user eller admin fejlede");
    }
}

exports.CreateList = CreateList;
exports.DeleteList = DeleteList;
exports.EditTitle = EditTitle;
exports.AddCard = AddCard;
exports.RemoveCard = RemoveCard;
exports.GetLists = GetLists;