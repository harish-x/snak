const express = require('express');
const app = express()
const morgan = require('morgan')
const mongoose = require('mongoose');
const router = require('./Router');
const cors = require('cors')
const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
require('dotenv').config()
const io = socketio(server,{
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]}});

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

  


const PORT = process.env.PORT
const connectionString = process.env.MONGOCONNECTION



// middleware
app.use(express.json())
app.use(morgan('dev'))
app.use(cors())

//router init
app.use('/api', router);


app.get('/', (req, res) => {
    res.json('wellcome')
})



app.use(()=>{
  io.on("connection", (socket) => {
    const id = socket.handshake.query.id;
    socket.join(id);

    socket.on("send-message", ({ recipients, text }) => {
      recipients.forEach((recipient) => {
        const newRecipients = recipients.filter((r) => r !== recipient);
        newRecipients.push(id);
        socket.broadcast.to(recipient).emit("receive-message", {
          recipients: newRecipients,
          sender: id,
          text,
        });
      });
    });
  });
})






//db connection
mongoose.connect(
  connectionString,
    {useNewUrlParser:true,useUnifiedTopology:true},
    (err) => {
        if (!err)
        {
            console.log('dtabase is connected sucessfully')
        }
        else
        {
            console.log('database connecction is failed')
        }
 } );


//------------------------socket

io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'snak', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});




server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
});
