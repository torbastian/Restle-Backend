const Board = require("../models/board_model");
const List = require("../models/list_model");
const User = require("../models/user_model")

async function GetBoardAsOwner(board_owner){
    try{
        return await Board.find({ owner: board_owner })
        .sort({ 'last_edited': -1 })
        .populate({
            path: 'owner',
            select: 'username create_date first_name last_name colour'
        })
        .populate({
            path: 'members',
            select: 'username create_date first_name last_name colour'
        })
        .select('-lists').then(boards => {
            return {
                success: true,
                message: "vi fandt " + boards.length + " som du er ejer af",
                object: boards
            }
        }).catch(err => {
            console.log("im fucked");
            return{
                success: false,
                message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
            }
        });
    }catch(err){
        console.log("im fucked");
        return{
            success: false,
            message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
        }
    }
}

async function GetBoardAsMember(member_id){
    try{
        return await Board.find({ members: member_id })
        .sort({ 'last_edited': -1 })
        .populate({
            path: 'owner',
            select: 'username created first_name last_name colour'
        })
        .populate({
            path: 'members',
            select: 'username created first_name last_name colour'
        })
        .select('-lists').then(boards => {
            return {
                success: true,
                message: "vi fandt " + boards.length + " som du er medlem af",
                object: boards
            }
        });
    }catch(err){
        return{
            success: false,
            message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
        }
    }
}

async function CreateBoard(title, owner, description = "", members = [], lists = []){
    const newBoard = new Board({
        create_date: Date.now(),
        last_edited: Date.now(),
        title: title,
        owner: owner,
        members: members,
        lists: lists,
        description: description
    });

    try{
        return await newBoard.save().then(board => {
            return {
                success: true,
                message: "board blev gemt",
                object: newBoard
            }
        }).catch(err =>{
            return {
                success: false,
                message: "board blev ikke gemt"
            }
        });
    }catch(err){
        return {
            success: false,
            message: "board blev ikke gemt. " + err
        }
    }
}

async function DeleteBoard(board_id, user_id){
    try{
        return await Board.findOne({_id: board_id}).then(board => {
            if(board.owner != user_id){
                return{
                    success: false,
                    message: "board kan kun slettes af board ejer."
                }
            }
        })

        await Board.deleteOne({_id: board_id });
        return {
            success: true,
            message: "board blev slettet"
        }
    }catch(err){
        return {
            success: false,
            message: "board blev ikke slettet. " + err
        }
    }
}

async function EditBoard(board_id, title){
    try{
        return Board.updateOne({_id: board_id}, {title: title, last_edited: Date.now()}).then(board => {
            if(board.modifiedCount == 1){
                return {
                    success: true,
                    message: "board blev updated",
                    object: board
                }
            }
        });
    }catch(err){
        return {
            success: false,
            message: "board blev ikke updated"
        };
    }
}

async function AddMember(board_id, member_id){
    try{
        return Board.findOne({_id: board_id}).then(board => {
            if(board.owner == member_id){
                return{
                    success: false,
                    message: "board ejer kan ikke være medlem"
                }
            }
            if(board.members.includes(member_id)){
                return {
                    success: false,
                    message: "bruger er allerede medlem af board"
                };
            }
            try{
                board.members.push(member_id);
                board.save().then(board => {
                    return{
                        success: true,
                        message: "bruger er blevet medlem af board",
                        object: board
                    };
                });
            }catch(err){
                return{
                    success: false,
                    message: "noget gik galt da vi forsøgte at tilføje medlem"
                };
            }  
        });
    }catch(err){
        return{
            success: false,
            message: "bruger blev ikke medlem. " + err
        };
    }
}

async function RemoveMember(board_id, member_id){
    try{
        return Board.findOne({_id: board_id}).then(board => {
            if(board.members.includes(member_id)){
                const index = board.members.indexOf(member_id);
                if(board.members.splice(index, 1).length == 0){
                    return{
                        success: false,
                        message: "medlem blev ikke fjernet"
                    };
                }
                board.save().then(board => {
                    return{
                        success: true,
                        message: "bruger er blevet fjernet som medlem",
                        object: board
                    } 
                }).catch(err => { 
                    return{
                        success: false,
                        message: "noget gik galt da vi forsøgte at fjerne medlem. " + err
                    }
                }); 
            }
        });
    }catch(err){
        return{
            success: false,
            message: "medlem blev ikke fjernet. " + err
        };
    }
}

async function ChangeOwner(board_id, owner_id, make_pre_owner_member = false){
    try{
        return Board.findOne({_id: board_id}).then(board => {
            
            if(make_pre_owner_member){
                board.members.push(board.owner)
            }
            board.owner = owner_id;
        });
    }catch(err){
        return{
            success: false,
            message: "Ejerskab blev ikke overført. " + err
        }
    }
}
/*
async function AddBoardList(board_id, member_id){
    try{
        Board.findOne({_id: board_id}).then(board => {
            if(board.members.includes(member_id)){
                return {
                    success: false,
                    message: "bruger er allerede medlem af board"
                };
            }else{
                try{
                    board.members.push(member_id);
                    await board.save();
                    return{
                        success: true,
                        message: "bruger er blevet medlem af board",
                        object: board
                    };
                }catch(err){
                    return{
                        success: false,
                        message: "noget gik galt da vi forsøgte at tilføje medlem"
                    };
                }
            }   
        });
    }catch(err){
        return{
            success: false,
            message: "bruger blev ikke medlem. " + err
        };
    }
}

async function RemoveList(board_id, member_id){
    try{
        Board.findOne({_id: board_id}).then(board => {
            if(board.owner == member_id){
                return {
                    success: false,
                    message: "kan ikke fjerne board owner fra medlems liste"
                };
            }else if(board.members.includes(member_id)){
                const index = board.members.indexOf(member_id);
                if(board.members.splice(index, 1).length == 0){
                    return{
                        success: false,
                        message: "medlem blev ikke fjernet"
                    };
                }else{
                    try{
                        await board.save();
                        return{
                            success: true,
                            message: "bruger er blevet fjernet som medlem",
                            object: board
                        }
                    }catch(err){
                        return{
                            success: false,
                            message: "noget gik galt da vi forsøgte at fjerne medlem"
                        }
                    }
                }
            }
        });
    }catch(err){
        return{
            success: false,
            message: "medlem blev ikke fjernet. " + err
        };
    }
}*/

exports.CreateBoard = CreateBoard;
exports.DeleteBoard = DeleteBoard;
exports.EditBoard = EditBoard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.ChangeOwner = ChangeOwner;
exports.GetBoardAsMember = GetBoardAsMember;
exports.GetBoardAsOwner = GetBoardAsOwner;