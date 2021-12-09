let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");
let localStream = null;
var remoteStream = null;
let state = "";
let pcConfig = {
  iceServers: [
    {
      urls: "turn:xmdrty.top:3478",
      credential: "123456",
      username: "rty",
    },
  ],
};
let pc = null;
let offerdesc = null;
let roomid;

//获取url参数
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}

// 开启视频
start();
function start() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("当前设备不支持webrtc");
    return;
  } else {
    let constrain = {
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
    navigator.mediaDevices
      .getUserMedia(constrain)
      .then(getMediaStream)
      .catch(handleError);
  }
}

// 获取视频流
function getMediaStream(stream) {
  if (localStream) {
    stream.getAudioTracks().forEach((track) => {
      localStream.addTrach(track);
      stream.removeTrack(track);
    });
  } else {
    localStream = stream;
  }
  localVideo.srcObject = localStream;
  // 会话连接
  connect();
}

function connect() {
  socket = io.connect();

  socket.on("joined", (roomid, id) => {
    console.log("接收到加入房间消息：", roomid, id);
    state = "joined";

    createPeerConnection();
    bindTracks();

    console.log("接收到加入房间消息, state=", state);
  });
  socket.on("otherjoin", (roomid) => {
    console.log("接收到加入房间消息：", roomid, state);
    if (state === "joined_unbind") {
      createPeerConnection();
      bindTracks();
    }

    state = "joined_conn";
    call();

    console.log("接收到其他人加入房间消息：, state=", state);
  });
  socket.on("full", (roomid, id) => {
    console.log("房间已满", roomid, id);
    socket.disconnect();
    hangup();
    closeLocalMedia();
    state = "leaved";
    console.log("房间已满, state=", state);
    alert("该房间已满，请尝试其他房间号");
  });
  socket.on("leaved", (roomid, id) => {
    console.log("离开房间", roomid, id);
    state = "leaved";
    socket.disconnect();
    console.log("离开房间, state=", state);
  });
  socket.on("bye", (room, id) => {
    console.log("receive bye message", roomid, id);
    state = "joined_unbind";
    hangup();
    console.log("receive bye message, state=", state);
  });
  socket.on("disconnect", (socket) => {
    console.log("receive disconnect message!", roomid);
    if (!(state === "leaved")) {
      hangup();
      closeLocalMedia();
    }
    state = "leaved";
  });
  socket.on("message", (roomid, data) => {
    console.log("receive message!", roomid, data);

    if (data === null || data === undefined) {
      console.error("the message is invalid!");
      return;
    }

    if (data.hasOwnProperty("type") && data.type === "offer") {
      pc.setRemoteDescription(new RTCSessionDescription(data));

      //create answer
      pc.createAnswer().then(getAnswer).catch(handleError);
    } else if (data.hasOwnProperty("type") && data.type == "answer") {
      pc.setRemoteDescription(new RTCSessionDescription(data));
    } else if (data.hasOwnProperty("type") && data.type === "candidate") {
      let candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        candidate: data.candidate,
      });
      pc.addIceCandidate(candidate);
    } else {
      console.log("the message is invalid!", data);
    }
  });
  roomid = getQueryVariable("room");
  socket.emit("join", roomid);

  return true;
}

function createPeerConnection() {
  if (!pc) {
    pc = new RTCPeerConnection(pcConfig);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendMessage(roomid, {
          type: "candidate",
          label: e.candidate.sdpMLineIndex,
          id: e.candidate.sdpMid,
          candidate: e.candidate.candidate,
        });
      } else {
        console.log("this is the end candidate");
      }
    };
    pc.ontrack = getRemoteStream;
  } else {
    console.log("pc have been created!");
  }
  return;
}

function getRemoteStream(e) {
  remoteStream = e.streams[0];
  remoteVideo.srcObject = e.streams[0];
}

function call() {
  if (state === "joined_conn") {
    let offerOptions = {
      offerToRecieveAudio: 1,
      offerToRecieveVideo: 1,
    };

    pc.createOffer(offerOptions).then(getOffer).catch(handleError);
  }
}

function getOffer(desc) {
  pc.setLocalDescription(desc);
  offerdesc = desc;
  sendMessage(roomid, offerdesc);
}

function sendMessage(roomid, data) {
  console.log("send message to other end", roomid, data);
  if (!socket) {
    console.log("socket is null");
  }
  socket.emit("message", roomid, data);
}

function hangup() {
  if (!pc) {
    return;
  }

  offerdesc = null;

  pc.close();
  pc = null;
}

function closeLocalMedia() {
  if (!(localStream === null || localStream === undefined)) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;
}

function getAnswer(desc) {
  pc.setLocalDescription(desc);
  sendMessage(roomid, desc);
}

function bindTracks() {
  if (pc === null || localStream === undefined) {
    console.error("pc is null or undefined!");
    return;
  }
  if (localStream === null || localStream === undefined) {
    console.error("localstream is null or undefined!");
    return;
  }
  //add all track into peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });
}

function leave() {
  socket.emit("leave", roomid); //notify server
  hangup();
  closeLocalMedia();
  window.location.href = "index.html";
}

function handleError(err) {
  alert("获取视频流失败");
  console.error("获取视频流失败", err);
}
