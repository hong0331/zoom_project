import http from "http";
import WebSocket from "ws";
import express from "express";
import { parse } from "path";

const app = express();

app.set("view engine", "pug"); 
app.set("views", __dirname + "/views"); 
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function onSocketClose(){
    console.log("Disconnected from browser ⛈️");
}; 

//한개이상의 브라우져에서 들어와 소통을 하고 싶을때 
// 연결된 모든 브라우져에 문자를 볼수있게 할거임 
const socketsArr=[];

// if messgage from back -> front, respond .... 
wss.on("connection", (socket) => {
    socketsArr.push(socket); 
    socket ["nickname"]="Anon";

    console.log("Connected to browser 🔥");
    socket.on("close",onSocketClose); 
    // send back the message to frontend 
    socket.on ("message",(message) => {
        //json string -> javascript 
        const parsed = JSON.parse(message);
        switch(parsed.type){
            case "new_message":
                socketsArr.forEach(aSocket => aSocket.send(`${socket.nickname}: ${parsed.payload}`));
                break; 
            case "nickname": 
                socket["nickname"]= parsed.payload;
        }
      
        
    });
});


server.listen(3000, handleListen);

