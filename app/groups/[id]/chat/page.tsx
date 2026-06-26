"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import EmojiPicker from "emoji-picker-react";
import { Smile, Paperclip, ImageIcon, MapPin, User, Navigation, FileVideo, X } from "lucide-react";

const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": getToken() ? `Bearer ${getToken()}` : "",
});
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://ishinadwelly.com/ws";

export default function GroupChatPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id as string;

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const stompClientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI States
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [uploadingMedia, setUploadingMedia] = useState(false);

    useEffect(() => {
        fetchMessages();
        connectWebSocket();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [groupId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/groups/${groupId}/messages?page=0&limit=50`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((data.messages || data.content || data).reverse());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const token = getToken();
        if (!token) return;

        const client = new Client({
            brokerURL: WS_BASE_URL,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            console.log("Connected to WebSocket");
            client.subscribe(`/topic/group/${groupId}`, (message) => {
                const newMsg = JSON.parse(message.body);
                setMessages((prev) => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            });
        };

        client.activate();
        stompClientRef.current = client;
    };

    const sendMessagePayload = async (payload: any) => {
        try {
            // If websocket is connected, use it for faster delivery
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.publish({
                    destination: `/app/group.chat/${groupId}`,
                    body: JSON.stringify(payload)
                });
                return; // Backend will broadcast the message back to us
            }

            // Fallback to REST API if websocket is not connected
            const res = await fetch(`${API_BASE_URL}/groups/${groupId}/messages`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                console.error("Failed to send message", await res.text());
                alert("Failed to send message");
            }
        } catch (e) {
            console.error(e);
            alert("Error sending message");
        }
    };

    const handleSendText = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        await sendMessagePayload({ content: newMessage, messageType: "TEXT" });
        setNewMessage("");
        setShowEmojiPicker(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setShowAttachmentMenu(false);
        setUploadingMedia(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await fetch(`${API_BASE_URL}/files/upload-ad-media`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${getToken()}` },
                body: formData
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                const msgType = data.type === 'video' ? 'VIDEO' : 'IMAGE';
                await sendMessagePayload({
                    content: `Shared ${msgType.toLowerCase()}`,
                    messageType: msgType,
                    mediaUrl: data.url
                });
            } else {
                alert("Media upload failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error uploading media");
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSendContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactName.trim() || !contactPhone.trim()) return;
        
        await sendMessagePayload({
            content: `Shared contact: ${contactName}`,
            messageType: "CONTACT",
            metadata: JSON.stringify({ name: contactName, phone: contactPhone })
        });
        
        setShowContactModal(false);
        setContactName("");
        setContactPhone("");
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

                    await sendMessagePayload({
                        content: `Shared contact: ${name}`,
                        messageType: "CONTACT",
                        metadata: JSON.stringify({ name: name, phone: phone })
                    });
                }
            } catch (err) {
                console.error("Contact selection failed or was canceled:", err);
                setShowContactModal(true); // Fallback to manual entry
            }
        } else {
            setShowContactModal(true); // Fallback for unsupported browsers
        }
    };

    const handleSendLocation = () => {
        setShowAttachmentMenu(false);
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            await sendMessagePayload({
                content: "Shared current location",
                messageType: "LOCATION",
                metadata: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude })
            });
        }, () => {
            alert("Unable to retrieve your location");
        });
    };

    const handleSendLiveLocation = async () => {
        setShowAttachmentMenu(false);
        await sendMessagePayload({
            content: "Started sharing live location",
            messageType: "LIVE_LOCATION"
        });
        alert("Live location sharing started (Simulated)");
    };

    const onEmojiClick = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const renderMessageContent = (msg: any) => {
        if (msg.messageType === "IMAGE" && msg.attachmentUrl) {
            return (
                <div className="mt-2">
                    <img src={msg.attachmentUrl.startsWith("http") ? msg.attachmentUrl : `${API_BASE_URL.replace("/api", "")}/${msg.attachmentUrl}`} alt="Attachment" className="max-w-full rounded-lg max-h-64 object-contain" />
                </div>
            );
        }
        if (msg.messageType === "VIDEO" && msg.attachmentUrl) {
            return (
                <div className="mt-2">
                    <video src={msg.attachmentUrl.startsWith("http") ? msg.attachmentUrl : `${API_BASE_URL.replace("/api", "")}/${msg.attachmentUrl}`} controls className="max-w-full rounded-lg max-h-64" />
                </div>
            );
        }
        if (msg.messageType === "CONTACT" && msg.metadata) {
            try {
                const meta = JSON.parse(msg.metadata);
                return (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-3 w-64">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600"><User size={24}/></div>
                        <div>
                            <div className="font-bold text-gray-800">{meta.name}</div>
                            <div className="text-sm text-gray-600">{meta.phone}</div>
                        </div>
                    </div>
                );
            } catch (e) { return <span>Invalid contact data</span>; }
        }
        if (msg.messageType === "LOCATION" && msg.metadata) {
            try {
                const meta = JSON.parse(msg.metadata);
                return (
                    <div className="mt-2">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${meta.lat},${meta.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded hover:bg-blue-100 transition">
                            <MapPin size={24} />
                            <span>View Location on Map</span>
                        </a>
                    </div>
                );
            } catch (e) { return <span>Invalid location data</span>; }
        }
        if (msg.messageType === "LIVE_LOCATION") {
            return (
                <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                    <Navigation size={24} className="animate-pulse" />
                    <span className="font-semibold">Live Location Active</span>
                </div>
            );
        }
        return <span className="text-sm text-gray-800 break-words">{msg.content}</span>;
    };

    if (loading) return <div className="p-6">Loading chat...</div>;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] max-w-4xl mx-auto p-4 relative">
                <div className="flex items-center gap-4 mb-4 bg-white p-4 rounded shadow shrink-0">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
                        &larr; Back
                    </button>
                    <h1 className="text-xl font-bold">Group Chat #{groupId}</h1>
                </div>

                <div className="flex-1 bg-gray-50 rounded-t shadow overflow-y-auto p-4 flex flex-col gap-4">
                    {messages.map((msg, idx) => (
                        <div key={msg.id || idx} className={`flex flex-col max-w-[80%] p-3 rounded-lg shadow-sm border ${msg.senderId === 1 ? 'bg-blue-50 border-blue-100 self-end' : 'bg-white border-gray-100 self-start'}`}>
                            <span className="text-xs font-semibold text-gray-500 mb-1">
                                {msg.senderUsername || msg.senderName || `User ${msg.senderId}`}
                            </span>
                            {renderMessageContent(msg)}
                            <span className="text-[10px] text-gray-400 mt-1 self-end">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 my-auto">No messages yet.</div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {uploadingMedia && (
                    <div className="bg-white p-2 text-center text-sm text-blue-600 border-x">
                        Uploading media...
                    </div>
                )}

                <div className="bg-white p-3 rounded-b shadow border-t relative shrink-0">
                    {showEmojiPicker && (
                        <div className="absolute bottom-full right-4 mb-2 z-50 shadow-xl rounded-lg">
                            <div className="flex justify-end bg-white p-1 rounded-t-lg border-b">
                                <button onClick={() => setShowEmojiPicker(false)} className="text-gray-500 hover:text-gray-800"><X size={16}/></button>
                            </div>
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                    )}
                    
                    {showAttachmentMenu && (
                        <div className="absolute bottom-full left-4 mb-2 z-50 bg-white shadow-xl rounded-lg border w-48 py-2 text-sm flex flex-col">
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                <ImageIcon size={18} className="text-blue-600"/> Photo & Video
                            </button>
                            {(typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) && (
                                <button type="button" onClick={handleSelectSystemContact} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left text-gray-800">
                                    <User size={18} className="text-purple-600"/> Contact
                                </button>
                            )}
                            <button onClick={handleSendLocation} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                <MapPin size={18} className="text-green-600"/> Current Location
                            </button>
                            <button onClick={handleSendLiveLocation} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-left">
                                <Navigation size={18} className="text-red-600"/> Live Location
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendText} className="flex gap-2 items-center">
                        <button type="button" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition">
                            <Paperclip size={24} />
                        </button>
                        
                        <input type="file" className="hidden" ref={fileInputRef} accept="image/*,video/*" onChange={handleFileUpload} />

                        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 hover:text-yellow-600 mr-2 transition">
                                <Smile size={24} />
                            </button>
                            <input 
                                type="text" 
                                className="flex-1 bg-transparent border-none focus:outline-none text-gray-800"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                        </div>

                        <button type="submit" disabled={!newMessage.trim() && !uploadingMedia} className="bg-blue-600 disabled:bg-blue-300 text-white rounded-full px-6 py-2.5 font-medium hover:bg-blue-700 transition">
                            Send
                        </button>
                    </form>
                </div>

                {/* Contact Modal */}
                {showContactModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold">Share Contact</h2>
                                <button onClick={() => setShowContactModal(false)}><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSendContact} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input type="text" className="w-full border rounded p-2" value={contactName} onChange={e => setContactName(e.target.value)} required placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                                    <input type="tel" className="w-full border rounded p-2" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required placeholder="+254 712 345 678" />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Share</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
}
