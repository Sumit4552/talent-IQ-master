import { useState, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const joinedCallId = useRef(null);

  const callId = session?.callId;
  const status = session?.status;

  useEffect(() => {
    if (!callId) return;
    if (!isHost && !isParticipant) return;
    if (status === "completed") return;
    if (joinedCallId.current === callId) return;

    let videoCall = null;
    let chatClientInstance = null;

    const initCall = async () => {
      try {
        joinedCallId.current = callId;
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken();

        const client = await initializeStreamClient(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        setStreamClient(client);

        videoCall = client.call("default", callId);
        await videoCall.join({ create: true });
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        if (chatClientInstance.userID !== userId) {
          if (chatClientInstance.userID) {
            await chatClientInstance.disconnectUser();
          }
          await chatClientInstance.connectUser(
            {
              id: userId,
              name: userName,
              image: userImage,
            },
            token
          );
        }
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", callId);
        await chatChannel.watch();
        setChannel(chatChannel);
      } catch (error) {
        joinedCallId.current = null;
        toast.error("Failed to join video call");
        console.error("Error init call", error);
      } finally {
        setIsInitializingCall(false);
      }
    };

    initCall();

    // cleanup - performance reasons
    return () => {
      joinedCallId.current = null;
      // iife
      (async () => {
        try {
          if (videoCall) await videoCall.leave().catch(() => {});
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [callId, status, isHost, isParticipant]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;
