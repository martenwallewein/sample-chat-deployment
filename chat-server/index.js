const app = require('express')()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const cors = require('cors')
const PORT = process.env.PORT || 5000
const { addUser, getUser, deleteUser, getUsers } = require('./users')
const Datastore = require('nedb');
const { Logger } = require('simple-node-logger')
const db = new Datastore({ filename: '/db/database.db' });
const log = require('simple-node-logger').createSimpleLogger();

db.loadDatabase(function(err) {
    // Start issuing commands after callback...
    if(err) {
        log.error(err);
        process.exit(1);
    }
});

app.use(cors())

io.on('connection', (socket) => {
    socket.on('login', ({ name, room }, callback) => {
        const { user, error } = addUser(socket.id, name, room)
        if (error) return callback(error)
        socket.join(user.room)
        socket.in(room).emit('notification', { title: 'Someone\'s here', description: `${user.name} just entered the room` })
        io.in(room).emit('users', getUsers(room))
        callback()
    })

    socket.on('sendMessage', message => {
        log.info('sendmessage');
        const user = getUser(socket.id);
        db.insert({ user: user.name, text: message }, (err, doc) => {
            if(err) {
                log.error(err);
                return;
            }
            log.info(doc);
            io.in(user.room).emit('message', { user: user.name, text: message });
        })
        
    })

    socket.on("disconnect", () => {
        console.log("User disconnected");
        const user = deleteUser(socket.id)
        if (user) {
            io.in(user.room).emit('notification', { title: 'Someone just left', description: `${user.name} just left the room` })
            io.in(user.room).emit('users', getUsers(user.room))
        }
    })
})

app.get('/', (req, res) => {
    res.send("Server is up and running")
})

app.get('/messages', (req, res) => {
    db.find({}).exec(function(err, docs) {
        if(err) {
            log.error(err);
            process.exit(1);
        }
        log.info('docs');
        log.info(docs);
        res.json(docs);
    });
})

http.listen(PORT, () => {
    console.log(`Listening to ${PORT}`);
})