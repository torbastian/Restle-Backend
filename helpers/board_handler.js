const mongoose = require("mongoose");
const Board = require("../models/board_model");
const { array } = require("joi");



async function CreateBoard(title, owner, members = [], lists = []){
    if(members.length == 0){
        members = [owner];
    }else if(!members.includes(owner)){
        members.push(owner);
    }
    
    const newBoard = new Board({
        create_date: Date.now(),
        last_edited: Date.now(),
        title: title,
        owner: owner,
        members: members,
        lists: lists
    });

    try{
        await newBoard.save();
        return {
            success: true,
            message: "board blev gemt",
            object: newBoard
        }
    }catch(err){
        return {
            success: false,
            message: "board blev ikke gemt. " + err
        }
    }
}

async function DeleteBoard(board_id){
    try{
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
        Board.updateOne({_id: board_id}, {title: title, last_edited: Date.now()}).then(board => {
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
        Board.findOne({_id: board_id}).then(board => {
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
        Board.findOne({_id: board_id}).then(board => {
            if(board.members.includes(member_id)){
                const index = board.members.indexOf(member_id);
                if(board.members.splice(index, 1).length == 0){
                    return{
                        success: false,
                        message: "medlem blev ikke fjernet"
                    };
                }
                board.save().catch(err => { 
                    return{
                        success: false,
                        message: "noget gik galt da vi forsøgte at fjerne medlem. " + err
                    }
                });
                return{
                    success: true,
                    message: "bruger er blevet fjernet som medlem",
                    object: board
                }   
            }
        });
    }catch(err){
        return{
            success: false,
            message: "medlem blev ikke fjernet. " + err
        };
    }
}

async function ChangeOwner(board_id, owner_id){
    try{
        Board.findOne({_id: board_id}).then(board => {
            board.owner = owner_id;
        });
    }catch(err){
        return{
            success: false,
            message: "Ejerskab blev ikke overført. " + err
        }
    }
}

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
}

exports.CreateBoard = CreateBoard;
exports.DeleteBoard = DeleteBoard;
exports.EditBoard = EditBoard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.ChangeOwner = ChangeOwner;