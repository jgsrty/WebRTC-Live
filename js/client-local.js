'use strict'

var localVideo = document.querySelector('video#localvideo');
var remoteVideo = document.querySelector('video#remotevideo');

var btnStart = document.querySelector('button#start');
var btnCall = document.querySelector('button#call');
var btnHangup = document.querySelector('button#hangup');

var offer = document.querySelector('textarea#offer');
var answer = document.querySelector('textarea#answer');

var localStream;
var remoteStream;
var pc1;
var pc2;


function getMediaStream(stream) {
	localVideo.srcObject = stream;
	localStream = stream;
}

function handleError(err) {
	console.error('failed to get media Stream!,', err);
}
function start() {
	if (!navigator.mediaDevices ||
		!navigator.mediaDevices.getUserMedia) {
		console.error('the getUserMedia is not supported!');
		return;
	} else {

		var constraints = {
			video: true,
			audio: true
		}
		navigator.mediaDevices.getUserMedia(constraints)
			.then(getMediaStream)
			.catch(handleError)
	}
}


function handleOfferError(err) {
	console.err("Failed to create offer: ", err);
}

function handleAnswerError(err) {
	console.err("Failed to create answer: ", err);
}

function getAnswer(desc) {
	pc2.setLocalDescription(desc);
	answer.value = desc.sdp;

	pc1.setRemoteDescription(desc);

}

function getOffer(desc) {
	pc1.setLocalDescription(desc);
	offer.value = desc.sdp;


	pc2.setRemoteDescription(desc);
	pc2.createAnswer()
		.then(getAnswer)
		.catch(handleAnswerError);
}


function getRemoteStream(e) {
	remoteVideo.srcObject = e.streams[0];
	remoteStream = e.streams[0];
}
function call() {
	pc1 = new RTCPeerConnection();
	pc2 = new RTCPeerConnection();
	pc1.onicecandidate = (e) => {
		pc2.addIceCandidate(e.candidate);
	}
	pc2.onicecandidate = (e) => {
		pc1.addIceCandidate(e.candidate);
	}

	pc2.ontrack = getRemoteStream;

	localStream.getTracks().forEach((track) => {
		pc1.addTrack(track, localStream);
	});

	var offerOptions = {
		offerToRecieveAudio: 1,
		offerToRecieveVideo: 1
	}

	pc1.createOffer(offerOptions)
		.then(getOffer)
		.catch(handleOfferError);
}

function hangup() {
	pc1.close();
	pc2.close();
	pc1 = null;
	pc2 = null;
}


btnStart.onclick = start;
btnCall.onclick = call;
btnHangup.onclick = hangup;


// var userName = document.querySelector('input#uesrname');
// var inputRoom = document.querySelector('input#room');
// var btnConnect = document.querySelector('button#connect');
// var outputArea = document.querySelector('textarea#output');
// var inputArea = document.querySelector('textarea#input');
// var btnSend = document.querySelector('button#send');

// const localVideo = document.querySelector('video');

// function gotLocalMediaStream(mediaStream){
//     localVideo.srcObject = mediaStream;
// }

// function handleLocalMediaStreamError(error){
//     console.log('navigator.getUserMedia error: ', error);
// }

// navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(
//     gotLocalMediaStream
// ).catch(
//     handleLocalMediaStreamError
// );

// var socket;
// var room;
// btnConnect.onclick = () => {

// 	//链接服务器
// 	socket = io.connect();
// 	//断开服务器
// 	socket.on('disconnect', socket => {
// 		console.log("disconnect===>" + socket);
// 	})
// 	//消息
// 	socket.on('joined', (room, id) => {
// 		btnConnect.disabled = true;
// 		inputArea.disabled = false;
// 		btnSend.disabled = false;
// 	});
// 	socket.on('leaved', (room, id) => {
// 		btnConnect.disabled = false;
// 		inputArea.disabled = true;
// 		btnSend.disabled = true;
// 	});
// 	socket.on('message', (room, id, data) => {
// 		console.log("data====>" + data);
// 		outputArea.scrollTop = outputArea.scrollHeight;//窗口总是显示最后的内容
// 		outputArea.value = outputArea.value + data + '\r';
// 	});
// 	//发送消息
// 	room = inputRoom.value;
// 	socket.emit('join', room);
// }

// btnSend.onclick = () => {
// 	if (inputArea.value === '') {
// 		return;
// 	}
// 	var data = inputArea.value;
// 	data = userName.value + ':' + data;
// 	socket.emit('message', room, data);
// 	outputArea.scrollTop = outputArea.scrollHeight;//窗口总是显示最后的内容
// 	outputArea.value = outputArea.value + data + '\r';
// 	inputArea.value = '';
// }

