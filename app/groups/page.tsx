"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { buildingsApi } from "@/lib/api";
import Link from "next/link";

const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": getToken() ? `Bearer ${getToken()}` : "",
});
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";

export default function GroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [buildings, setBuildings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", description: "", buildingId: "", adminOnlyMessage: false });
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            fetchData();
        }
    }, []);

    const fetchData = async () => {
        try {
            const [groupsRes, buildingsList] = await Promise.all([
                fetch(`${API_BASE_URL}/groups/my`, { headers: getAuthHeaders() }),
                buildingsApi.getAll()
            ]);
            if (groupsRes.ok) setGroups(await groupsRes.json());
            setBuildings(buildingsList || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/groups`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: newGroup.name,
                    description: newGroup.description,
                    buildingId: parseInt(newGroup.buildingId),
                    adminOnlyMessage: newGroup.adminOnlyMessage
                })
            });
            if (res.ok) {
                const created = await res.json();
                setGroups([...groups, created]);
                setShowCreate(false);
                setNewGroup({ name: "", description: "", buildingId: "", adminOnlyMessage: false });
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
    <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Chat Groups</h1>
                    <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Create Group</button>
                </div>

                {showCreate && (
                    <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 space-y-4">
                        <h2 className="text-xl font-bold">New Group</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input required type="text" className="w-full border rounded p-2" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea className="w-full border rounded p-2" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Building portfolio</label>
                            <select required className="w-full border rounded p-2 text-gray-900 bg-white" value={newGroup.buildingId} onChange={e => setNewGroup({...newGroup, buildingId: e.target.value})}>
                                <option value="">Select a building</option>
                                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="adminOnly" checked={newGroup.adminOnlyMessage} onChange={e => setNewGroup({...newGroup, adminOnlyMessage: e.target.checked})} />
                            <label htmlFor="adminOnly">Admin Only Messaging</label>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                            <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                        </div>
                    </form>
                )}

                {loading ? <p>Loading...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map(g => (
                            <Link key={g.id} href={`/groups/${g.id}`} className="bg-white p-4 rounded shadow hover:shadow-md hover:ring-2 hover:ring-blue-500 transition-all block">
                                <h3 className="font-bold text-lg">{g.name}</h3>
                                <p className="text-sm text-gray-500 mb-2">{g.description}</p>
                                <p className="text-sm font-medium">Members: {g.members?.length || 0}</p>
                                <p className="text-xs mt-2">{g.adminOnlyMessage ? "🔒 Admin Only Messages" : "💬 Open Chat"}</p>
                            </Link>
                        ))}
                    </div>
                )}
    </div>
    );
}
