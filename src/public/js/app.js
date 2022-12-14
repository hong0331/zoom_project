// import { WebSocketServer } from "ws";

const socket = io (); 
const welcome= document.getElementById('welcome');
const form = welcome.querySelector("form");

// hide the messagebox until the roomName has enter
const room= document.getElementById("room");
room.hidden= true; 

let roomName; 

/**
 * pass user's room name to backend
 * @param {*} event 
 */
function handleRoomSubmit(event){
    event.preventDefault();

    const input= form.querySelector('input');
    socket.emit('enter_room', input.value, showRoom); 
    roomName= input.value;
    input.value=""
}

/**
 * pass user's messaage to backend
 * @param {*} event 
 */
function handleMessageSubmit(event){
    event.preventDefault();
    const input= room.querySelector("#msg input");
    const value= input.value; 
    socket.emit("new_message",input.value, roomName, () => {
        addMessage(`You: ${value}`); 
    }); 
    input.value="";
}
/**
 * 
 * @param {*} event 
 */
function handleNickNameSubmit(event){
    event.preventDefault();
    const input= room.querySelector("#nickName input");
    socket.emit('nickName',input.value); 
}
/**
 * display the passed in message 
 * @param {*} message 
 */
function addMessage(message){

    const ul = room.querySelector('ul');
    const li= document.createElement('li');

    li.innerText=message;
    ul.appendChild(li);
}
/**
 * Allow user to write message,
 * Display the room name that user has entered  
 */
function showRoom(){
    welcome.hidden= true;
    room.hidden=false; 
    
    const h3= room.querySelector('h3');
    h3.innerText= `Room: ${roomName}`;

    const msgForm = room.querySelector('#msg');
    const nickNameForm = room.querySelector('#nickName');

    msgForm.addEventListener("submit",handleMessageSubmit);
    nickNameForm.addEventListener("submit",handleNickNameSubmit);
}



form.addEventListener("submit",handleRoomSubmit);

// if someone joined, send message to all people in the room 
socket.on("welcome",(user, newCount) =>{
    const h3= room.querySelector('h3');
    h3.innerText= `Room: ${roomName} (${newCount})`;

    addMessage(`${user} joined!`);
}); 

// if someone left the room, notify others in the room 
socket.on("bye",(user, newCount)=>{
    const h3= room.querySelector('h3');
    h3.innerText= `Room: ${roomName} (${newCount})`;

    addMessage(`${user} left!`);
});

socket.on("new_message", addMessage); 

//send sockets if new room has created 
socket.on("room_change",(rooms)=>{
    const roomList = welcome.querySelector('ul');
    //update it if rooms is unavailable
    roomList.innerHTML="";
    if (rooms.length===0){
        return; 
    }
   
    rooms.forEach((room)=>{
        const li= document.createElement('li');
        li.innerText=room;
        roomList.append(li); 
    })
});