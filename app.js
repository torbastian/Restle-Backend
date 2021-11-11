require('dotenv/config');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

//TEST-----------------------------------------------------------
async function TEST(){
  const Board = require("./helpers/board_handler");
  const List = require("./helpers/list_handler");
  const Card = require("./helpers/card_handler");
  
  const boardResponse = await Board.CreateBoard("testTitle", "6184ea59d58bc4c9980f68e1", "testDescription");
  const board = boardResponse.object;

  const ListRespons1 = await List.CreateList(board._id, "testListe1");
  const list1 = ListRespons1.object;

  let card1;
  await Card.CreateCard(board._id, list1._id, "testCard 1", "testDescription", function(card){
    console.log("RETURN CARD CREATECARD 1: " + card.message);
    if(card.success){
      card1 = card.object;
    }
  });

  await Card.AddMember(card1._id, "6184ea59d58bc4c9980f68e1", function(card){
    console.log("RETURN CARD ADDMEMBER 1: " + card.message);
  });

  await Card.AddMember(card1._id, "6181328703821ded9204e383", function(card){
    console.log("RETURN CARD ADDMEMBER 2: " + card.message);
  });

  await Card.RemoveMember(card1._id, "6184ea59d58bc4c9980f68e1", function(card){
    console.log("RETURN CARD REMOVEMEMBER 1: " + card.message);
  });

  const ListRespons2 = await List.CreateList(board._id, "testListe2");
  const list2 = ListRespons2.object;

  let card2
  await Card.CreateCard(board._id, list2._id, "testCard 1", "testDescription", function(card){
    console.log("RETURN CARD CREATECARD 2: " + card.message);
    if(card.success){
      card2 = card;
    }
  });

  await Card.DeleteCard(card2._id, function(card){
    console.log("RETURN CARD DELETECARD 1: " + card.message);
  })
  
  await Card.CreateCard(board._id, list2._id, "testCard 2", "testDescription",function(card){
    console.log(card.message);
  });


}


//TEST();
//TEST END-------------------------------------------------------

//Importer routes
const userRoute = require('./route/route-user');
const { startWebscoketServer } = require('./helpers/websocket');
const { CreateBoard } = require('./helpers/board_handler');

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Routes
app.get('/', (req, res) => {
  res.send('Restle API');
});

app.use('/user', userRoute);

console.log(process.env.DB_CONNECTION);

mongoose.connect(process.env.DB_CONNECTION,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(
  () => { console.log("Connected to DB") },
  err => { console.log(err) }
);

const server = app.listen(3001);

const wss = startWebscoketServer(server);