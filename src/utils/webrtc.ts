/**
 * WebRTC Utility Functions
 *
 * This file contains helper functions for WebRTC implementation.
 * These are placeholder functions that should be implemented when
 * the backend signaling server is ready.
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

/**
 * Creates a new RTCPeerConnection with the given configuration
 */
export const createPeerConnection = (
  config: WebRTCConfig = DEFAULT_WEBRTC_CONFIG,
): RTCPeerConnection => {
  return new RTCPeerConnection(config);
};

/**
 * Handles incoming remote stream and attaches it to a video element
 */
export const handleRemoteStream = (
  peerConnection: RTCPeerConnection,
  videoElement: HTMLVideoElement,
): void => {
  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      videoElement.srcObject = event.streams[0];
    }
  };
};

/**
 * Handles ICE candidate events
 * TODO: Send candidates to signaling server
 */
export const handleIceCandidate = (
  peerConnection: RTCPeerConnection,
  onCandidate: (candidate: RTCIceCandidate) => void,
): void => {
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onCandidate(event.candidate);
    }
  };
};

/**
 * Handles connection state changes
 */
export const handleConnectionStateChange = (
  peerConnection: RTCPeerConnection,
  onStateChange: (state: RTCPeerConnectionState) => void,
): void => {
  peerConnection.onconnectionstatechange = () => {
    onStateChange(peerConnection.connectionState);
  };
};

/**
 * Creates an offer for the peer connection
 * TODO: Send offer to signaling server
 */
export const createOffer = async (
  peerConnection: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

/**
 * Handles an incoming answer from the remote peer
 * TODO: Receive answer from signaling server
 */
export const handleAnswer = async (
  peerConnection: RTCPeerConnection,
  answer: RTCSessionDescriptionInit,
): Promise<void> => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

/**
 * Adds an ICE candidate received from the remote peer
 * TODO: Receive candidates from signaling server
 */
export const addIceCandidate = async (
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidateInit,
): Promise<void> => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

/**
 * Closes the peer connection and cleans up resources
 */
export const closePeerConnection = (peerConnection: RTCPeerConnection): void => {
  peerConnection.close();
};

/**
 * Example usage for teacher viewing student stream:
 *
 * const peerConnection = createPeerConnection();
 * const videoElement = document.getElementById('student-video') as HTMLVideoElement;
 *
 * handleRemoteStream(peerConnection, videoElement);
 * handleIceCandidate(peerConnection, (candidate) => {
 *   // Send candidate to signaling server
 *   sendToSignalingServer({ type: 'ice-candidate', candidate });
 * });
 *
 * handleConnectionStateChange(peerConnection, (state) => {
 *   console.log('Connection state:', state);
 * });
 *
 * // Create offer and send to signaling server
 * const offer = await createOffer(peerConnection);
 * sendToSignalingServer({ type: 'offer', offer });
 *
 * // When answer is received from signaling server
 * await handleAnswer(peerConnection, receivedAnswer);
 *
 * // When ICE candidate is received from signaling server
 * await addIceCandidate(peerConnection, receivedCandidate);
 *
 * // Cleanup when done
 * closePeerConnection(peerConnection);
 */
