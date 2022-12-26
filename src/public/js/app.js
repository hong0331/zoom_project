const socket = io();

//video call 
const call = document.getElementById("call");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

//room
const welcome = document.getElementById("welcome");


call.hidden= true; 

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];

        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
    
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}


function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}


function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find(sender=> sender.track.kind ==="video");
        videoSender.replaceTrack(videoTrack);
   }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Welcome form ; joining the room 
const welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden=true;
    call.hidden=false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room",input.value);
    roomName=input.value;
    input.value="";
}

welcomeForm.addEventListener("submit",handleWelcomeSubmit);

//socket call for offer broswer
socket.on("welcome", async () => {
    console.log("someone joined");
    // create a offer to connect the stream
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer,roomName);
    console.log("send the offer");
})

//socket for browser that recieve the offer
socket.on("offer", async (offer) => {
    //receive offer 
    console.log("received the offer"); 
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit('answer',answer, roomName);
    console.log("sent the answer");
 
})

socket.on("answer",answer => {
    console.log("received the answer"); 
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", (ice) =>{
    console.log("received candidate"); 
    myPeerConnection.addIceCandidate(ice);
})
/**
 * RTC code: 
 * Configure streams  
 */
function makeConnection(){
    myPeerConnection =  new RTCPeerConnection();
    // register icecandidate event  
    myPeerConnection.addEventListener("icecandidate",handleIce);
    // register addstream event 
    myPeerConnection.addEventListener("addstream",handleAddStream);
    myStream
        .getTracks()
        .forEach ((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice",data.candidate,roomName);
}

function handleAddStream(data){
    console.log("peer's data stream: ", data.stream);
    console.log("my stream",myStream);

    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject= data.stream;
}