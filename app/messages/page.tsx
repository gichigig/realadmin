"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { conversationsApi, Conversation, Message } from "@/lib/api";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import EmojiPicker from "emoji-picker-react";
import { Smile, MapPin, User as UserIconLucide, Navigation, Image as ImageIcon } from "lucide-react";
import DwellyOrbitingLoader from "@/components/DwellyOrbitingLoader";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isPrependingRef = useRef<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState<boolean>(false);
  const stompClientRef = useRef<Client | null>(null);
  const conversationSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [otherUserTyping, setOtherUserTyping] = useState<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDisconnectedAtRef = useRef<number | null>(null);

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
      reconnectDelay: 5000 + Math.floor(Math.random() * 5000), // Thundering herd jitter: 5-10s
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

        // Subscribe to typing events
        client.subscribe(`/topic/user/${user.id}/typing`, (message: IMessage) => {
          const typingEvent = JSON.parse(message.body);
          if (typingEvent.isTyping || typingEvent.typing) {
            setOtherUserTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
            }, 3000);
          } else {
            setOtherUserTyping(false);
          }
        });

        // Subscribe to read receipts
        client.subscribe(`/topic/user/${user.id}/read-receipts`, (message: IMessage) => {
          const receipt = JSON.parse(message.body);
          setMessages((prev) => prev.map((m) => {
            if (m.senderId !== receipt.readByUserId) {
              return { ...m, isRead: true };
            }
            return m;
          }));
        });
      },
      onDisconnect: () => {
        console.log("WebSocket disconnected");
        lastDisconnectedAtRef.current = Date.now();
        setWsConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        lastDisconnectedAtRef.current = Date.now();
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

        // Send read receipt if the message was sent by the other user
        if (newMsg.senderId !== user?.id) {
          stompClientRef.current?.publish({
            destination: `/app/chat/${selectedConversation.id}/read`,
            body: JSON.stringify({})
          });
        }
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

  // Load messages when conversation is selected (or when reconnected to WebSocket)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      // Thundering herd protection: If reconnecting after a brief drop (< 5s), skip catch-up sync
      if (wsConnected && lastDisconnectedAtRef.current) {
        const dropDuration = Date.now() - lastDisconnectedAtRef.current;
        lastDisconnectedAtRef.current = null;
        if (dropDuration < 5000) {
          return;
        }
        // Add randomized query smoothing jitter (0-1.5s) to prevent thundering herd database spikes
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 1500)));
      }

      setMessagesLoading(true);
      setCurrentPage(0);
      setHasMoreMessages(false);
      try {
        const result = await conversationsApi.getMessagesPaginated(selectedConversation.id, 0, 25);
        isPrependingRef.current = false;
        setMessages(result.messages);
        setHasMoreMessages(result.hasMore);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setMessagesLoading(false);
        // Publish read receipt since we loaded messages
        if (wsConnected && stompClientRef.current) {
          stompClientRef.current.publish({
            destination: `/app/chat/${selectedConversation.id}/read`,
            body: JSON.stringify({})
          });
        }
      }
    };

    fetchMessages();
  }, [selectedConversation, wsConnected]);

  // Smart Conditional Polling for new messages (ONLY active when WebSocket is disconnected AND tab is visible)
  useEffect(() => {
    if (!selectedConversation || wsConnected) return;

    const pollInterval = setInterval(async () => {
      if (document.hidden) return; // Skip if browser tab is hidden/minimized
      try {
        const result = await conversationsApi.getMessagesPaginated(selectedConversation.id, 0, 25);
        if (result.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id).filter(Boolean));
            const newMessages = result.messages.filter((m) => m.id && !existingIds.has(m.id));
            if (newMessages.length > 0) {
              return [...prev, ...newMessages];
            }
            return prev;
          });
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 12000); // Relaxed 12-second interval when WebSocket is down

    return () => clearInterval(pollInterval);
  }, [selectedConversation, wsConnected]);

  // Smart Conditional Polling for conversation list (ONLY active when WebSocket is disconnected AND tab is visible)
  useEffect(() => {
    if (wsConnected) return;

    const pollInterval = setInterval(async () => {
      if (document.hidden) return; // Skip if browser tab is hidden/minimized
      try {
        const data = await conversationsApi.getAll();
        setConversations(data);
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 15000); // Relaxed 15-second interval when WebSocket is down

    return () => clearInterval(pollInterval);
  }, [wsConnected]);

  // Instant sync whenever user returns to the browser tab (visibility change)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const data = await conversationsApi.getAll();
          setConversations(data);
          if (selectedConversation) {
            const result = await conversationsApi.getMessagesPaginated(selectedConversation.id, 0, 25);
            if (result.messages.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id).filter(Boolean));
                const newMessages = result.messages.filter((m) => m.id && !existingIds.has(m.id));
                if (newMessages.length > 0) {
                  return [...prev, ...newMessages];
                }
                return prev;
              });
            }
          }
        } catch (error) {
          // Silently ignore sync errors
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [selectedConversation]);

  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMoreMessages || !hasMoreMessages) return;
    setLoadingMoreMessages(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    const prevScrollTop = container?.scrollTop || 0;

    try {
      const nextPage = currentPage + 1;
      const result = await conversationsApi.getMessagesPaginated(selectedConversation.id, nextPage, 25);

      isPrependingRef.current = true;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id).filter(Boolean));
        const uniqueOlder = result.messages.filter((m) => !m.id || !existingIds.has(m.id));
        return [...uniqueOlder, ...prev];
      });
      setCurrentPage(nextPage);
      setHasMoreMessages(result.hasMore);

      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        }
      }, 0);
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 80 && !loadingMoreMessages && hasMoreMessages && !messagesLoading) {
      loadMoreMessages();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      return;
    }
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
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

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
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

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

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !selectedConversation || sending) return;
    setSending(true);
    try {
      const message = await conversationsApi.sendCustomMessage(selectedConversation.id, {
        content: `Shared contact: ${contactName}`,
        messageType: "CONTACT",
        metadata: JSON.stringify({ name: contactName, phone: contactPhone })
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setShowContactModal(false);
      setContactName("");
      setContactPhone("");
    } catch (error) {
      alert("Failed to share contact");
    } finally {
      setSending(false);
    }
  };

  const handleSelectSystemContact = async () => {
    setShowAttachmentMenu(false);
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const name = (contact.name && contact.name.length > 0) ? contact.name[0] : 'Unknown Contact';
          const phone = (contact.tel && contact.tel.length > 0) ? contact.tel[0] : '';

          if (!phone) {
            alert("Selected contact doesn't have a phone number.");
            return;
          }

          if (!selectedConversation) return;
          setSending(true);
          try {
            const message = await conversationsApi.sendCustomMessage(selectedConversation.id, {
              content: `Shared contact: ${name}`,
              messageType: "CONTACT",
              metadata: JSON.stringify({ name: name, phone: phone })
            });
            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          } catch (error) {
            alert("Failed to share contact");
          } finally {
            setSending(false);
          }
        }
      } catch (err) {
        console.error("Contact selection failed or was canceled:", err);
        setShowContactModal(true); // Fallback to manual entry on error/cancel
      }
    } else {
      setShowContactModal(true); // Fallback for unsupported browsers
    }
  };

  const handleSendLocation = async () => {
    setShowAttachmentMenu(false);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!selectedConversation) return;
        setSending(true);
        try {
          const message = await conversationsApi.sendCustomMessage(selectedConversation.id, {
            content: "Shared current location",
            messageType: "LOCATION",
            metadata: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude })
          });
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        } catch (err) {
          alert("Unable to share location");
        } finally {
          setSending(false);
        }
      }, () => {
        alert("Unable to retrieve your location");
      });
  };

  const handleSendLiveLocation = async () => {
    setShowAttachmentMenu(false);
    if (!selectedConversation) return;
    setSending(true);
    try {
      const message = await conversationsApi.sendCustomMessage(selectedConversation.id, {
        content: "Started sharing live location",
        messageType: "LIVE_LOCATION"
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      alert("Live location sharing started (Simulated)");
    } catch (err) {
      alert("Failed to share live location");
    } finally {
      setSending(false);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
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
        <DwellyOrbitingLoader size={32} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col min-h-0 md:h-[calc(100vh-120px)]">
      <div className={`flex-shrink-0 px-4 pt-3 pb-2 md:px-0 md:pt-0 md:pb-4 flex items-center justify-between ${selectedConversation ? "hidden md:flex" : "flex"}`}>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-xs md:text-sm text-gray-600">Reply to inquiries about your rental properties</p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <span className="flex items-center gap-1 text-xs md:text-sm text-green-600 font-medium">
              <SignalIcon className="w-4 h-4" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs md:text-sm text-gray-400">
              <SignalSlashIcon className="w-4 h-4" />
              Connecting...
            </span>
          )}
        </div>
      </div>

      <div className="bg-white md:rounded-lg md:shadow flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden border-t md:border-t-0 border-gray-200">
        {/* Conversations List */}
        <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col min-h-0 ${selectedConversation ? "hidden md:flex" : "flex flex-1"}`}>
          <div className="p-3.5 md:p-4 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 text-sm md:text-base">Conversations</h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 min-h-[200px]">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-center font-medium">No conversations yet</p>
              <p className="text-xs md:text-sm text-center mt-2 text-gray-400">
                When someone inquires about your properties, conversations will appear here.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-3.5 md:p-4 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50/80 border-l-4 border-l-blue-600 pl-2.5 md:pl-3" : ""
                  }`}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <UserCircleIcon className="w-11 h-11 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate text-sm md:text-base">
                        {conversation.userName}
                      </p>
                      <span className="text-[11px] md:text-xs text-gray-500 flex-shrink-0">
                        {formatDate(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 truncate">
                      <HomeIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{conversation.rentalTitle}</span>
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-xs md:text-sm text-gray-500 truncate mt-1.5 font-normal">
                        {conversation.lastMessage}
                      </p>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center self-center shadow-sm">
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-3 md:p-4 border-b border-gray-200 flex items-center gap-2.5 md:gap-3 bg-white flex-shrink-0 shadow-2xs z-10">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 -ml-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  title="Back to conversations"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <UserCircleIcon className="w-9 h-9 md:w-10 md:h-10 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 flex items-center gap-2 truncate">
                    <span className="truncate">{selectedConversation.userName}</span>
                    {otherUserTyping && <span className="text-xs text-blue-500 italic font-normal flex-shrink-0">typing...</span>}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 truncate">
                    <HomeIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{selectedConversation.rentalTitle}</span>
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0 bg-gray-50/30"
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mb-2 text-gray-300" />
                    <p className="font-medium text-gray-600">No messages yet</p>
                    <p className="text-xs md:text-sm mt-1">Start the conversation below!</p>
                  </div>
                ) : (
                  <>
                    {loadingMoreMessages && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {!loadingMoreMessages && hasMoreMessages && (
                      <div className="flex justify-center py-2">
                        <button
                          onClick={loadMoreMessages}
                          type="button"
                          className="text-xs bg-white hover:bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full border border-gray-200 transition shadow-xs font-medium cursor-pointer"
                        >
                          Load earlier messages
                        </button>
                      </div>
                    )}
                    {messages.map((message, idx) => {
                      const isOwner = message.senderId === user?.id;
                      const isLastMessage = idx === messages.length - 1;
                      return (
                        <div
                          key={message.id ? `msg-${message.id}-${idx}` : `msg-fallback-${idx}`}
                          className={`flex flex-col ${isOwner ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 break-words shadow-2xs ${
                              isOwner
                                ? "bg-blue-600 text-white rounded-br-2xs"
                                : "bg-white text-gray-900 border border-gray-200/80 rounded-bl-2xs"
                            }`}
                          >
                            {/* Media content */}
                            {message.mediaUrl && message.messageType === "IMAGE" && (
                              <a href={getMediaUrl(message.mediaUrl)} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={getMediaUrl(message.mediaUrl)}
                                  alt="Shared image"
                                  className="max-w-full rounded-lg mb-1.5 cursor-pointer hover:opacity-95 transition-opacity max-h-60 md:max-h-72 object-cover"
                                />
                              </a>
                            )}
                            {message.mediaUrl && message.messageType === "VIDEO" && (
                              <video
                                src={getMediaUrl(message.mediaUrl)}
                                controls
                                className="max-w-full rounded-lg mb-1.5 max-h-60 md:max-h-72 bg-black"
                              />
                            )}
                            {message.mediaUrl && message.messageType === "DOCUMENT" && (
                              <a
                                href={getMediaUrl(message.mediaUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2.5 rounded-xl mb-1.5 ${
                                  isOwner ? "bg-blue-700/80 hover:bg-blue-700" : "bg-gray-100 hover:bg-gray-200"
                                } transition-colors`}
                              >
                                <DocumentIcon className="w-6 h-6 flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{message.content || "Document"}</span>
                              </a>
                            )}
                            {message.messageType === "CONTACT" && message.metadata && (
                              (() => {
                                try {
                                  const meta = JSON.parse(message.metadata);
                                  return (
                                    <div className={`mt-1.5 ${isOwner ? "bg-blue-700/80 border-blue-500 text-white" : "bg-gray-50 border-gray-200 text-gray-800"} border rounded-xl p-3 flex items-center gap-3 min-w-[200px] max-w-full`}>
                                      <div className={`${isOwner ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"} p-2 rounded-full flex-shrink-0`}><UserIconLucide size={20} /></div>
                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{meta.name}</p>
                                        <p className={`text-xs truncate ${isOwner ? "text-blue-100" : "text-gray-500"}`}>{meta.phone}</p>
                                      </div>
                                    </div>
                                  );
                                } catch (e) { return null; }
                              })()
                            )}
                            {message.messageType === "LOCATION" && message.metadata && (
                              (() => {
                                try {
                                  const meta = JSON.parse(message.metadata);
                                  return (
                                    <div className="mt-1.5">
                                      <a href={`https://www.google.com/maps/search/?api=1&query=${meta.lat},${meta.lng}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 ${isOwner ? "text-white bg-blue-700/80 hover:bg-blue-700" : "text-blue-600 bg-blue-50 hover:bg-blue-100"} p-3 rounded-xl transition font-medium text-sm`}>
                                        <MapPin size={20} className="flex-shrink-0" />
                                        <span>View Location on Map</span>
                                      </a>
                                    </div>
                                  );
                                } catch (e) { return <span className="text-xs">Invalid location data</span>; }
                              })()
                            )}
                            {message.messageType === "LIVE_LOCATION" && (
                              <div className={`mt-1.5 flex items-center gap-2 ${isOwner ? "text-red-100 bg-red-500" : "text-red-600 bg-red-50"} p-3 rounded-xl font-semibold text-sm`}>
                                <Navigation size={20} className="animate-pulse flex-shrink-0" />
                                <span>Live Location Active</span>
                              </div>
                            )}
                            {/* Text content (hide for media types that already show content) */}
                            {(!message.mediaUrl && message.messageType !== "CONTACT" && message.messageType !== "LOCATION" && message.messageType !== "LIVE_LOCATION") && (
                              <p className="text-sm md:text-base leading-relaxed">{message.content}</p>
                            )}
                            <p
                              className={`text-[10px] md:text-xs mt-1 text-right ${
                                isOwner ? "text-blue-100/90" : "text-gray-400"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                          </div>
                          {isOwner && isLastMessage && message.isRead && (
                            <div className="text-[11px] text-gray-400 mt-1 mr-1 font-medium">Seen</div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-2.5 md:p-4 border-t border-gray-200 bg-white flex-shrink-0 z-10">
                {/* File Preview */}
                {selectedFile && (
                  <div className="mb-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DocumentIcon className="w-7 h-7 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      disabled={sending || uploadingFile}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Attach file or share"
                    >
                      <PaperClipIcon className="w-5 h-5" />
                    </button>
                    {showAttachmentMenu && (
                      <div className="absolute bottom-full left-0 mb-2 z-50 bg-white shadow-2xl rounded-2xl border border-gray-100 w-56 py-2 text-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <button type="button" onClick={() => { setShowAttachmentMenu(false); fileInputRef.current?.click(); }} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-medium text-gray-800 min-h-[44px]">
                          <ImageIcon size={18} className="text-blue-600 flex-shrink-0" /> Photo & Video
                        </button>
                        {(typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) && (
                          <button type="button" onClick={handleSelectSystemContact} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-medium text-gray-800 min-h-[44px]">
                            <UserIconLucide size={18} className="text-purple-600 flex-shrink-0" /> Contact
                          </button>
                        )}
                        <button type="button" onClick={handleSendLocation} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-medium text-gray-800 min-h-[44px]">
                          <MapPin size={18} className="text-green-600 flex-shrink-0" /> Current Location
                        </button>
                        <button type="button" onClick={handleSendLiveLocation} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left font-medium text-gray-800 min-h-[44px]">
                          <Navigation size={18} className="text-red-600 flex-shrink-0" /> Live Location
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative flex-1 flex items-center border border-gray-300 rounded-xl bg-gray-50/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-w-0 transition-all">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-yellow-600 transition flex-shrink-0"
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 md:left-0 mb-2 z-50 shadow-2xl rounded-2xl bg-white border border-gray-100 w-[calc(100vw-24px)] max-w-[350px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center bg-gray-50 px-3 py-2 border-b">
                          <span className="text-xs font-semibold text-gray-600">Select Emoji</span>
                          <button type="button" onClick={() => setShowEmojiPicker(false)} className="p-1 min-h-[32px] min-w-[32px] flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="w-full">
                          <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={360} />
                        </div>
                      </div>
                    )}
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (wsConnected && stompClientRef.current && selectedConversation) {
                          stompClientRef.current.publish({
                            destination: `/app/chat/${selectedConversation.id}/typing`,
                            body: JSON.stringify({ isTyping: e.target.value.length > 0, typing: e.target.value.length > 0 })
                          });
                        }
                      }}
                      placeholder={selectedFile ? "Add a caption (optional)..." : "Type a message..."}
                      className="flex-1 px-2 py-2.5 text-base md:text-sm bg-transparent focus:outline-none min-w-0 text-gray-900 placeholder:text-gray-400"
                      disabled={sending}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className="min-h-[44px] min-w-[44px] px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0 shadow-sm"
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
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-semibold text-gray-700">Select a conversation</p>
              <p className="text-xs md:text-sm mt-1 max-w-sm">Choose a conversation from the sidebar to start replying to property inquiries</p>
            </div>
          )}
        </div>
      </div>
      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Share Contact</h2>
              <button onClick={() => setShowContactModal(false)} className="p-1 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"><XMarkIcon className="w-5 h-5 text-gray-500 hover:text-gray-800" /></button>
            </div>
            <form onSubmit={handleSendContact} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Name</label>
                <input type="text" className="w-full border border-gray-300 rounded-xl p-3 text-base md:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={contactName} onChange={e => setContactName(e.target.value)} required placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Phone Number</label>
                <input type="tel" className="w-full border border-gray-300 rounded-xl p-3 text-base md:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required placeholder="+254 712 345 678" />
              </div>
              <div className="flex justify-end gap-2.5 mt-4">
                <button type="button" onClick={() => setShowContactModal(false)} className="px-5 py-2.5 min-h-[44px] text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 min-h-[44px] bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">Share Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
