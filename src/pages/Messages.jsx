import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeRoomName, setActiveRoomName] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false); // For mobile toggle

  // Refs for scrolling and subscription
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // --- 1. INITIAL LOAD & ROOM MANAGEMENT ---
  useEffect(() => {
    if (!user) return;

    const initChat = async () => {
      // Check if we need to start a NEW chat from a listing
      const chatWithUserId = searchParams.get("chat_with");
      const paramRoomId = searchParams.get("room_id");

      if (chatWithUserId) {
        await handleStartNewChat(chatWithUserId);
      } else {
        await fetchRooms();
        if (paramRoomId) {
          // If URL has ?room_id=123, open that room immediately
          const room = rooms.find((r) => r.id === paramRoomId); // Might not be loaded yet in state, so we handle in fetchRooms or rely on subsequent render
          handleRoomSelect(paramRoomId);
        }
      }
    };

    initChat();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current)
        supabase.removeChannel(subscriptionRef.current);
    };
  }, [user]);

  // Handle URL params updates (e.g. back button)
  useEffect(() => {
    const roomId = searchParams.get("room_id");
    if (roomId && roomId !== activeRoomId) {
      handleRoomSelect(roomId);
    } else if (!roomId) {
      setActiveRoomId(null);
      setShowChatMobile(false);
    }
  }, [searchParams, rooms]);

  const handleStartNewChat = async (targetUserId) => {
    if (!user) return;

    // Check if room exists
    const { data: existingRoom } = await supabase
      .from("chat_rooms")
      .select("id")
      .or(
        `and(buyer_id.eq.${user.id},farmer_id.eq.${targetUserId}),and(buyer_id.eq.${targetUserId},farmer_id.eq.${user.id})`
      )
      .single();

    if (existingRoom) {
      navigate(`/messages?room_id=${existingRoom.id}`, { replace: true });
    } else {
      // Create new room (Assuming current user is 'buyer' in this context for simplicity,
      // or just inserting based on who initiated)
      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert({ buyer_id: user.id, farmer_id: targetUserId })
        .select()
        .single();

      if (error) {
        console.error("Error creating room:", error);
        alert("Could not start chat.");
      } else {
        // Refresh rooms then navigate
        await fetchRooms();
        navigate(`/messages?room_id=${newRoom.id}`, { replace: true });
      }
    }
  };

  const fetchRooms = async () => {
    setLoadingRooms(true);
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(
        `
        id, 
        buyer_id, 
        farmer_id, 
        buyer:buyer_id ( full_name ), 
        farmer:farmer_id ( full_name )
      `
      )
      .or(`buyer_id.eq.${user.id},farmer_id.eq.${user.id}`);

    if (!error && data) {
      setRooms(data);
      // If URL param exists but we haven't selected it yet (initial load case)
      const paramRoomId = searchParams.get("room_id");
      if (paramRoomId) {
        const targetRoom = data.find((r) => r.id === paramRoomId);
        if (targetRoom) {
          const name =
            user.id === targetRoom.buyer_id
              ? targetRoom.farmer?.full_name
              : targetRoom.buyer?.full_name;
          setActiveRoomName(name || "Chat");
          setActiveRoomId(paramRoomId);
          setShowChatMobile(true);
        }
      }
    }
    setLoadingRooms(false);
  };

  // --- 2. ACTIVE ROOM LOGIC ---
  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
      subscribeToRoom(activeRoomId);
      scrollToBottom();
    }
  }, [activeRoomId]);

  const handleRoomSelect = (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const otherUserName =
      user.id === room.buyer_id
        ? room.farmer?.full_name
        : room.buyer?.full_name;

    setActiveRoomId(roomId);
    setActiveRoomName(otherUserName || "Chat");
    setShowChatMobile(true);
    navigate(`/messages?room_id=${roomId}`); // Sync URL
  };

  const handleBackToInbox = () => {
    setActiveRoomId(null);
    setShowChatMobile(false);
    navigate("/messages");
    if (subscriptionRef.current)
      supabase.removeChannel(subscriptionRef.current);
  };

  // --- 3. MESSAGES & REALTIME ---
  const fetchMessages = async (roomId) => {
    setLoadingMessages(true);
    // Mark as read
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", roomId)
      .neq("sender_id", user.id);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (!error) setMessages(data || []);
    setLoadingMessages(false);
  };

  const subscribeToRoom = (roomId) => {
    if (subscriptionRef.current)
      supabase.removeChannel(subscriptionRef.current);

    subscriptionRef.current = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
          // If it's not my message, mark read immediately while viewing
          if (payload.new.sender_id !== user.id) {
            supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", payload.new.id);
          }
        }
      )
      .subscribe();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    const text = newMessage.trim();
    setNewMessage(""); // Clear input immediately (Optimistic UI)

    // Optimistic Update
    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      room_id: activeRoomId,
      sender_id: user.id,
      message_content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    // Send to DB
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: activeRoomId,
        sender_id: user.id,
        message_content: text,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on failure (optional)
    } else {
      // Replace temp ID with real ID (optional, but good for keys)
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // --- 4. FORMATTING HELPERS ---
  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- RENDER ---
  return (
    <div className="chat-page-container">
      <div className={`chat-layout ${showChatMobile ? "chat-active" : ""}`}>
        {/* SIDEBAR: Room List */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h2>Messages</h2>
          </div>
          <div className="room-list" id="room-list">
            {loadingRooms ? (
              <p style={{ padding: "1rem" }}>Loading conversations...</p>
            ) : rooms.length === 0 ? (
              <p style={{ padding: "1rem", color: "#666" }}>
                No conversations yet.
              </p>
            ) : (
              rooms.map((room) => {
                const name =
                  user.id === room.buyer_id
                    ? room.farmer?.full_name
                    : room.buyer?.full_name;
                return (
                  <div
                    key={room.id}
                    className={`room-item ${
                      activeRoomId === room.id ? "active-room" : ""
                    }`}
                    onClick={() => handleRoomSelect(room.id)}
                  >
                    <div className="avatar-circle">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <span className="room-name">{name || "Unknown User"}</span>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MAIN: Chat Area */}
        <section className="chat-main">
          {activeRoomId ? (
            <div className="chat-container">
              {/* Header */}
              <div className="chat-header" id="chat-header">
                <button className="chat-back-btn" onClick={handleBackToInbox}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="chat-user-info">
                  <h3>{activeRoomName}</h3>
                </div>
              </div>

              {/* Messages List */}
              <div className="chat-messages" id="chat-messages">
                {loadingMessages ? (
                  <p style={{ textAlign: "center", marginTop: "2rem" }}>
                    Loading history...
                  </p>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_id === user.id;
                    const showDate =
                      index === 0 ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(messages[index - 1].created_at).toDateString();

                    return (
                      <React.Fragment key={msg.id || index}>
                        {showDate && (
                          <div className="date-header">
                            {new Date(msg.created_at).toLocaleDateString()}
                          </div>
                        )}
                        <div
                          className={`message-bubble ${
                            isMe ? "sender" : "receiver"
                          }`}
                        >
                          <span>{msg.message_content}</span>
                          <span className="message-time">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          ) : (
            <div className="chat-empty-state">
              <i className="fa-solid fa-comments icon"></i>
              <h3>Select a Conversation</h3>
              <p>Choose a chat from the left to start messaging.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Messages;
