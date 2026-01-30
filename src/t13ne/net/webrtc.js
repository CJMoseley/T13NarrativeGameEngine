// Minimal WebRTC helper (stub) - provides helpers for creating RTCPeerConnection and DataChannel
//needs much more implementation to be useable. SHould handle signaling, ICE candidates, connection state changes, etc. 
//should also provide event handlers for data channel open, message, close, error events, voice chat etc
export function createPeerConnection(config) {
    const pc = new RTCPeerConnection(config);
    return pc;
}

export function createDataChannel(pc, label, options) {
    const dc = pc.createDataChannel(label, options || {});
    return dc;
}
