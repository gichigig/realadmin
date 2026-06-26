"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";

const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": getToken() ? `Bearer ${getToken()}` : "",
});
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://ishinadwelly.com/api";

export default function GroupDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id as string;
    
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMember, setNewMember] = useState({ identifier: "", role: "MEMBER" });
    const [addError, setAddError] = useState("");

    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setGroup(await res.json());
            } else {
                console.error("Failed to fetch group details");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError("");
        try {
            const res = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    identifier: newMember.identifier,
                    role: newMember.role
                })
            });
            if (res.ok) {
                await fetchGroupDetails(); // Refresh list
                setShowAddMember(false);
                setNewMember({ identifier: "", role: "MEMBER" });
            } else {
                const err = await res.json().catch(() => ({}));
                setAddError(err.message || "Failed to add member.");
            }
        } catch (e: any) {
            console.error(e);
            setAddError(e.message || "Network error");
        }
    };

    const handleRemoveMember = async (targetUserId: number) => {
        if (!confirm("Remove this member?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${targetUserId}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                fetchGroupDetails();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-6">Loading group details...</div>;
    if (!group) return <div className="p-6">Group not found.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
                        &larr; Back
                    </button>
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                </div>

                <div className="bg-white p-6 rounded shadow mb-6">
                    <h2 className="text-lg font-semibold mb-2">Group Information</h2>
                    <p className="text-gray-600 mb-2">{group.description || "No description provided."}</p>
                    <div className="flex gap-4 text-sm mt-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            Building ID: {group.buildingId}
                        </span>
                        <button 
                            onClick={() => router.push(`/groups/${groupId}/chat`)}
                            className="bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 cursor-pointer"
                        >
                            {group.adminOnlyMessage ? "🔒 Admin Only Messaging" : "💬 Open Chat"}
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4 mt-8">
                    <h2 className="text-xl font-bold">Members ({group.members?.length || 0})</h2>
                    <button onClick={() => setShowAddMember(true)} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                        Add Member
                    </button>
                </div>

                {showAddMember && (
                    <form onSubmit={handleAddMember} className="bg-gray-50 border p-4 rounded mb-6 space-y-4">
                        <h3 className="font-semibold">Add New Member</h3>
                        {addError && <p className="text-red-500 text-sm">{addError}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">User ID, Email, or Phone</label>
                                <input required type="text" className="w-full border rounded p-2" value={newMember.identifier} onChange={e => setNewMember({...newMember, identifier: e.target.value})} placeholder="e.g. 1 or john@example.com or +254..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select className="w-full border rounded p-2" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add</button>
                            <button type="button" onClick={() => setShowAddMember(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                        </div>
                    </form>
                )}

                <div className="bg-white rounded shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {group.members?.map((m: any) => (
                                <tr key={m.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.userId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {m.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleRemoveMember(m.userId)} className="text-red-600 hover:text-red-900">Remove</button>
                                    </td>
                                </tr>
                            ))}
                            {(!group.members || group.members.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No members found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
        </div>
    );
}
