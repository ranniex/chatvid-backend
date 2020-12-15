const http = require('http');
const express = require('express');
const cors = require('cors');
const router = require("./router");

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js')

const PORT = process.env.PORT || 5000;

const app = express();
// app.use(cors());
const server = http.createServer(app);

const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

app.use(router);

io.on('connection', (socket)=>{
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });    
        
        if(error) return callback(error);

        socket.join(user.room);

        socket.emit('message', { user: 'admin', text: `${user.name}, Bienvenido a la sala de chat ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} entró a la sala.` })

        io.to(user.room).emit('roomData', {room:user.room, users: getUsersInRoom(user.room)})


        callback();
    })   

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        callback();
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `El usuario ${user.name} salió del chat.`})
        }
    })
})


server.listen(PORT, ()=> console.log(`Server started on port: ${PORT}`));