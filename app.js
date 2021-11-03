require('dotenv/config');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();

//Importer routes
const userRoute = require('./route/route-user');
const { startWebscoketServer } = require('./helpers/websocket');

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