
window.mainrtc.connectionP2P = (function(){
	var message = {
		supportRTC : "Your browser doesn't support WEBRTC",
		supportMedia : "Browser doesn't support getUserMedia",
		supportCapture : "Raised an error when capturing camera"
	};
	var videoRemote = document.querySelector('#remote'), videoLocal = document.querySelector('#local'),
		remoteConnection, localConnection, stream;
	var streamUserConstraints = mainrtc.devices.mobileDimension(), streaming = false, connectedUser;

	function startConnection(){
		if (mainrtc.devices.hasUserMedia()){

			navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			navigator.getUserMedia(streamUserConstraints, function(myStream){
				streaming = true;
				stream = myStream;
				videoLocal.srcObject = stream;
				console.log("startConnection", stream);
				mainrtc.devices.hasRTCPeerConnection() ? setupPeerConnection(stream) : alert(message.supportRTC);
				}, function(err){	console.log(message.supportCapture)});
		} else {
			alert(message.supportMedia);
		}
	}
	function setupPeerConnection(stream){

		//configuration of network for best path;
		var configuration = {iceServers:[{"url":"stun:stun.l.google.com:19302"}]};

		//entry point for WEBRTC API (initialize a connection, connect to peers, and attach media stream)
		localConnection = new RTCPeerConnection(configuration);

        console.log("connectionIceState: ",connectionIceState());
        connectionIceListener();
		//Addstream
		localConnection.addStream(stream);

		localConnection.onaddstream = function(event){
			//videoRemote.srcObject = event.stream;
			videoRemote.src = window.URL.createObjectURL(event.stream);
			videoRemote.play();
		};
		//Ice Candidate Listener
		localConnection.onicecandidate = function(event){
			if(event.candidate){
				console.log("onicecandidate fired: ", event.candidate);
				send(JSON.stringify({type:'candidate', candidate: event.candidate }));
			}
		};

	}
	function startPeerConnection(callee) {
		connectedUser = callee;
		localConnection.createOffer().then(function(offer){
			console.log("offer: " + offer);
			send(JSON.stringify({type: 'offer', offer: offer, name: callee}));
			localConnection.setLocalDescription(offer);
		}).catch(function(e){
			console.log(e + " create Offer error");
		});
	}
	function onCandidate(candidate){
		localConnection.addIceCandidate(new RTCIceCandidate(candidate));
	}
	function onOffer(offer, caller) {
		if(connectionIceState() === "connected") {
			send(JSON.stringify({type: "reject", name: caller}));
			return console.info("Blocked income call from: ",caller);
		}
		console.info("Income offer",offer);
		connectedUser = caller;
		localConnection.setRemoteDescription(new RTCSessionDescription(offer));

		localConnection.createAnswer().then(function(answer){
			console.log("answer: " + answer);
			localConnection.setLocalDescription(answer);
			send(JSON.stringify({type: 'answer', answer: answer, name: caller}));
		}).catch(function(event){
			console.error(event + " create Offer error");
		});
	}
	function onAnswer(answer){
		localConnection.setRemoteDescription(new RTCSessionDescription(answer));
	}
	function onLeave(){
		connectedUser = null;
		/*wrong! could be not exist*/
		if(videoRemote.src != null) videoRemote.src = null;
		localConnection.close();
		localConnection.onicecandidate = null;
		localConnection.onaddstream = null;
        /*Setup connection for new call*/
		this.setupPeerConnection(stream);
		console.log("onLeave, browser disconnect");
	}
	function signOut(){
	    if(connectionIceState() != "new") {
	        console.log("signOut(), state");
	        this.onLeave();
	    }
		send(JSON.stringify({type: "leave", name: userLogin, signOut: true}));
		stream.getTracks().forEach(function(track){track.stop()});
		console.log("signOut", localConnection.signalingState);
	}
	function connectionIceListener(){
	    localConnection.oniceconnectionstatechange = function () {
	    	mainrtc.connectionP2P.iceState = localConnection.iceConnectionState;
	        document.getElementById("user-state").textContent  = localConnection.iceConnectionState;
			console.log("iceListener",
				localConnection.iceConnectionState,
				localConnection.signalingState);
        }
    }
    function connectionIceState(){
        return localConnection.iceConnectionState;

    }
	return {"startConnection" : startConnection,
		"startPeerConnection" : startPeerConnection,
		"setupPeerConnection" : setupPeerConnection,
		"onCandidate" : onCandidate,
		"onOffer" : onOffer,
		"onAnswer" : onAnswer,
		"onLeave" : onLeave,
		"signOut" : signOut,
        "connectionIceState" : connectionIceState
	};
})();












