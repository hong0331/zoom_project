import http from "http";
import {Server}from "socket.io";
import express from "express";
import {instrument} from "@socket.io/admin-ui";


const app = express();

app.set("view engine", "pug"); 
app.set("views", __dirname + "/views"); 
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// create the server that could support both http and ws 
const httpServer = http.createServer(app);
const wsServer= new Server(httpServer,{
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(wsServer, {
    auth: false,
    mode: "development",
  });

/**
 * find the public sockets 
 */
function publicRooms(){
    const {sockets:
            { adapter:
                {sids,rooms},
            },
        } = wsServer; 

    const publicRooms=[];

    rooms.forEach((_,key)=>{
        if (sids.get(key)===undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}
/**
 * Count people in the certain room 
 * @param {*} roomName 
 * @returns 
 */
function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

/**
 * connect socket with front end 
 */
wsServer.on('connection', socket => {
    socket["nickName"]="Anon";
    // display the event of the socket 
    socket.onAny((event)=>{
        console.log (`Socket event : ${event}`);
    }); 


    socket.on("enter_room",(roomName, done) => {
        // print the socket id 
        console.log(socket.rooms);
        // join the room into the socket
        socket.join(roomName);
        done();
        // send message to the sockets in the joined room 
        socket.to(roomName).emit("welcome", socket.nickName,countRoom(roomName));
        //send room status to all
        wsServer.sockets.emit("room_change",publicRooms());
    }); 
    // if someone left from the room.. 
    socket.on("disconnecting",()=>{
        socket.rooms.forEach(room=> socket.to(room).emit("bye", socket.nickName, countRoom(room)-1));
    });

    socket.on("disconnect",()=>{
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message",(msg, roomName, done) => {
        socket.to(roomName).emit("new_message",`${socket.nickName}:${msg}`);
        done();
    });
    // in the nickname event, insert nickname in the socket
    socket.on("nickName",nickName=> (socket["nickName"] = nickName));
});




httpServer.listen(3000,handleListen);