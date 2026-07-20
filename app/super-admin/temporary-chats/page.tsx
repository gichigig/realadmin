"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ChatMessage {
  id: number;
  roomId: string;
  senderAlias: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

interface ChatRoom {
  id: number;
  roomId: string;
  foundIdId: number;
  finderAlias: string;
  ownerAlias: string;
  createdAt: string;
  lastMessageAt: string;
  expiredForUser: boolean;
  messages: ChatMessage[];
}

export default function TemporaryChatsAuditPage() {
  const { isSuperAdmin, token } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && isSuperAdmin) {
      fetchRooms();
    }
  }, [token, isSuperAdmin]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("https://ishinadwelly.com/api/admin/temporary-chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load temporary chats");
      const data = await res.json();
      setRooms(data);
    } catch (err: any) {
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-7 h-7 text-indigo-600" />
            Found ID Temporary Chats Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit secure anonymous recovery chats between ID Finders and Owners. User chats auto-expire after 7 days, but remain permanently auditable here.
          </p>
        </div>
        <button
          onClick={fetchRooms}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <UserGroupIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">No Temporary Chats Yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            Anonymous recovery chats initiated by finders or owners will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rooms Table / List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="font-semibold text-slate-700 text-sm">
                Active & Archived Rooms ({rooms.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-4 cursor-pointer transition flex items-center justify-between hover:bg-indigo-50/40 ${
                    selectedRoom?.roomId === room.roomId ? "bg-indigo-50 border-l-4 border-indigo-600" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        Room #{room.roomId.substring(0, 8)}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                        Found ID #{room.foundIdId}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {room.finderAlias} ↔ {room.ownerAlias}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      Last activity: {new Date(room.lastMessageAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {room.messages?.length || 0} msgs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript Drawer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[600px]">
            {selectedRoom ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Transcript: #{selectedRoom.roomId.substring(0, 8)}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Found ID Record #{selectedRoom.foundIdId}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {selectedRoom.messages?.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 my-auto">
                      No messages exchanged yet.
                    </p>
                  ) : (
                    selectedRoom.messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          msg.senderRole === "FINDER"
                            ? "bg-indigo-50 text-indigo-950 ml-6"
                            : "bg-slate-100 text-slate-800 mr-6"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{msg.senderAlias} ({msg.senderRole})</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                  Super Admin Audit Mode — Permanent Log
                </div>
              </>
            ) : (
              <div className="my-auto text-center p-6 text-slate-400">
                <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a chat room on the left to inspect its full transcript</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
