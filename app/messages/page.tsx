"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { conversationsApi, Conversation, Message } from "@/lib/api";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  HomeIcon,
  ArrowLeftIcon,
  SignalIcon,
  SignalSlashIcon,
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";
const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || API_BASE_URL.replace(/\/api\/?$/, "");

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);
  const conversationSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.id || stompClientRef.current?.connected) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("WebSocket connected");
        setWsConnected(true);

        // Subscribe to user-specific notifications for new conversations/messages
        client.subscribe(`/topic/user/${user.id}/notifications`, (message: IMessage) => {
          const notification = JSON.parse(message.body);
          console.log("Received user notification:", notification);
          
          // Backend sends MessageDTO, check if it has conversationId (indicating a new message)
          // This is for messages in conversations we're NOT currently viewing
          if (notification.conversationId) {
            // Refresh conversations list to update last message preview and unread counts
            conversationsApi.getAll().then(setConversations).catch(console.error);
          }
        });
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
        setWsConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        setWsConnected(false);
      },
    });

    stompClientRef.current = client;
    client.activate();
  }, [user?.id]);

  // Disconnect WebSocket on unmount
  useEffect(() => {
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, []);

  // Connect WebSocket when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      connectWebSocket();
    }
  }, [authLoading, isAuthenticated, user?.id, connectWebSocket]);

  // Subscribe to conversation messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation || !stompClientRef.current?.connected) return;

    // Unsubscribe from previous conversation
    if (conversationSubscriptionRef.current) {
      conversationSubscriptionRef.current.unsubscribe();
    }

    // Subscribe to the selected conversation's messages
    const subscription = stompClientRef.current.subscribe(
      `/topic/conversation/${selectedConversation.id}`,
      (message: IMessage) => {
        const newMsg: Message = JSON.parse(message.body);
        console.log("Received message:", newMsg);
        
        // Add message if not already present (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMsg.id);
          if (exists) return prev;
          return [...prev, newMsg];
        });
        
        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: newMsg.content, lastMessageAt: newMsg.createdAt }
              : c
          )
        );
      }
    );

    conversationSubscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversation, wsConnected]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (authLoading || !user?.id) return;

      try {
        const data = await conversationsApi.getAll();
        setConversations(data);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [authLoading, user?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      setMessagesLoading(true);
      try {
        const data = await conversationsApi.getMessages(selectedConversation.id);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // Poll for new messages as fallback (in case WebSocket misses something)
  useEffect(() => {
    if (!selectedConversation) return;

    const pollInterval = setInterval(async () => {
      try {
        const data = await conversationsApi.getMessages(selectedConversation.id);
        // Only update if there are new messages
        if (data.length > messages.length) {
          setMessages(data);
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [selectedConversation, messages.length]);

  // Poll for conversation list updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await conversationsApi.getAll();
        setConversations(data);
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || sending) return;

    // If there's a file, send it
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      // Send via WebSocket if connected, otherwise fall back to REST
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/chat/${selectedConversation.id}`,
          body: JSON.stringify({
            content: messageContent,
            senderId: user?.id,
          }),
        });
        // Message will be added via the subscription callback
      } else {
        // Fallback to REST API
        const message = await conversationsApi.sendMessage(selectedConversation.id, messageContent);
        setMessages((prev) => [...prev, message]);
        
        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(messageContent); // Restore message on error
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation || uploadingFile) return;

    setUploadingFile(true);
    setSending(true);

    try {
      const message = await conversationsApi.sendFile(selectedConversation.id, selectedFile);
      setMessages((prev) => [...prev, message]);
      
      // Update conversation's last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        )
      );

      clearSelectedFile();
    } catch (error: any) {
      console.error("Failed to send file:", error);
      alert(error.message || "Failed to send file");
    } finally {
      setUploadingFile(false);
      setSending(false);
    }
  };

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Reply to inquiries about your rental properties</p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <SignalIcon className="w-4 h-4" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <SignalSlashIcon className="w-4 h-4" />
              Connecting...
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow h-[calc(100%-80px)] flex overflow-hidden">
        {/* Conversations List */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-center">No conversations yet</p>
              <p className="text-sm text-center mt-2">
                When someone inquires about your properties, conversations will appear here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {conversation.userName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                        <HomeIcon className="w-3 h-3" />
                        {conversation.rentalTitle}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedConversation.userName}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <HomeIcon className="w-3 h-3" />
                    {selectedConversation.rentalTitle}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwner = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwner ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwner
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {/* Media content */}
                          {message.mediaUrl && message.messageType === "IMAGE" && (
                            <a href={getMediaUrl(message.mediaUrl)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getMediaUrl(message.mediaUrl)}
                                alt="Shared image"
                                className="max-w-full rounded-md mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ maxHeight: "300px" }}
                              />
                            </a>
                          )}
                          {message.mediaUrl && message.messageType === "VIDEO" && (
                            <video
                              src={getMediaUrl(message.mediaUrl)}
                              controls
                              className="max-w-full rounded-md mb-1"
                              style={{ maxHeight: "300px" }}
                            />
                          )}
                          {message.mediaUrl && message.messageType === "DOCUMENT" && (
                            <a
                              href={getMediaUrl(message.mediaUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-md mb-1 ${
                                isOwner ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-200 hover:bg-gray-300"
                              } transition-colors`}
                            >
                              <DocumentIcon className="w-6 h-6 flex-shrink-0" />
                              <span className="text-sm truncate">{message.content || "Document"}</span>
                            </a>
                          )}
                          {/* Text content (hide for media types that already show content) */}
                          {(!message.mediaUrl || message.messageType === "TEXT" || !message.messageType) && (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <p
                            className={`text-xs mt-1 ${
                              isOwner ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                {/* File Preview */}
                {selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                        <DocumentIcon className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending || uploadingFile}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Attach file"
                  >
                    <PaperClipIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
