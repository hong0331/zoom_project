const messageList= document.querySelector('ul');
const nickNameForm= document.querySelector('#nickName');
const messageForm= document.querySelector('#message');

const socket = new WebSocket(`ws://${window.location.host}`);

// send information in a string format to backend 
function makeMessage(type,payload){
    const msg= {type, payload}; 
    return JSON.stringify(msg);
};

socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
    socket
});

socket.addEventListener("message",(message)=> {
    const li = document.createElement ('li');
    li.innerText=message.data;
    messageList.append(li);
    // console.log("Just got this:", message.data," from the server" )
})

socket.addEventListener("close",()=>{
    console.log("Disconnected from Server 🚫 ")
})

function handleSubmit(event){
    event.preventDefault();
    const input= messageForm.querySelector("input");
    //sending message to backend
    socket.send (makeMessage("new_message", input.value)); 
    const li = document.createElement ('li');
    li.innerText=`You: ${input.value}`;
    messageList.append(li);
    input.value= ""; 
}; 

function handleNickNameSubmit(event){
    event.preventDefault();
    const input = nickNameForm.querySelector("input");
    socket.send(makeMessage("nickname",input.value)); 
    input.value="";
};

messageForm.addEventListener("submit", handleSubmit); 
nickNameForm.addEventListener("submit", handleNickNameSubmit); 







// // after 10 seconds, sending message backend -> frontend 
// setTimeout(() => {
//     socket.send("hello from browser 💫");
// },10000);