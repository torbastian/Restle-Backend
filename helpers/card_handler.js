const CardModel = require("../models/card_model");
const Card = require("../models/card_model");
const List = require("../models/list_model");
const Lock = require("./lock_model");


async function GetCards(board_id){
    try{
        return Card.find({board: board_id}).then(cards =>{
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

async function CreateCard(user_id, board_id, list_id, title, description, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    if(title.length > 40){
        return{
            success: false,
            message: "title er for lang, max 40 charatere"
        }
    }
    if(description.length > 1024){
        return{
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
    }).save();

    try{
        list = await List.findOne({_id: list_id});
        console.log(list);
        console.log(newCard);
        result = Lock.LockModel(list, 
        function(){
            list.cards.push(newCard._id); 
            console.log("cards pushed");
            list.save();
            console.log("list saved");
            return true;
        },
        function(err, result){
            console.log("newCard = " + newCard);
            if(newCard){
                console.log("calling callback");
                callback({
                    success: true,
                    message: "Kort er blevet gemt",
                    object: newCard});
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
        callback({
            success: false,
            message: "Kort blev ikke gemt. " + err
        });
    }
}

async function DeleteCard(user_id, board_id, card_id, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try{
        card = await Card.findOne({_id: card_id});
        
        result = Lock.LockModel(card, 
        function(){
            card.deleteOne();
            return true; 
        },
        function(err, result){
            if(card){
                callback({
                    success: true,
                    message: "Kort er blevet slettet",
                    object: card});
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
        callback({
            success: false,
            message: "Korted blev ikke slettet. " + err
        });
    }
}

async function EditDescription(user_id, board_id, card_id, description, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    card = await Card.findOne({_id: card_id});
    result = Lock.LockModel(card, 
        function(){
            card.description = description;
            card.save();
        },
        function(err, result){
            if(card){
                callback({
                    success: true,
                    message: "Kort beskrivelse er blevet gemt",
                    object: card});
            }                
        }
    );
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
}

async function AddMember(user_id, board_id, card_id, member_id, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    card = await Card.findOne({_id: card_id});
    result = Lock.LockModel(card, 
        function(){
            if(!card.members.includes(member_id)){
                card.members.push(member_id); 
                card.save();
                return true;
            }
        },
        function(err, result){
            if(result){
                console.log("RETURNING ITEM: dasfsdf" + result);
                callback({
                    success: true,
                    message: "Kort er blevet gemt",
                    object: result});
            }                
        }
    );
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
    }
}

async function RemoveMember(user_id, board_id, card_id, member_id, callback){
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    card = await Card.findOne({_id: card_id});
    console.log("CARD! " + card);
    result = Lock.LockModel(card, 
        function(){
            if(card.members.includes(member_id)){
                const index = card.members.indexOf(member_id);
                card.members.splice(index, 1); 
                card.save();
                return true;
            }
        },
        function(err, result){
            if(card){
                callback({
                    success: true,
                    message: "Kort er blevet gemt",
                    object: card});
            }                
        }
    );
    if(result){
        callback(result);
    }else{
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await sleep(1000);
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

exports.CreateCard = CreateCard;
exports.DeleteCard = DeleteCard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.EditDescription = EditDescription;
exports.GetCards = GetCards;