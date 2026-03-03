"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  emailVerified?: string | null;
}


export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "admin",
  });
  const [error, setError] = useState("");

  async function fetchUsers() {
    try {
      setIsLoading(true);
      const host = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      const res = await fetch(`${host}/api/admin/users`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    fetchUsers();
  }, []);

  // SEARCH + FILTER
  useEffect(() => {
    let filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [search, roleFilter, users]);

  // CREATE USER
  async function handleCreateUser() {
    setError("");

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("All required fields must be filled.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const host = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${host}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error creating user");
      setShowForm(false);
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        role: "admin",
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  }

  // DELETE USER
  async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const host = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      await fetch(`${host}/api/admin/users/${id}`, {
        method: "DELETE",
      });

      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 px-4 py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <Link
          href="/admin/dashboard"
          className="flex items-center text-amber-700 hover:text-amber-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">
            Manage Users
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded-lg px-4 py-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="store-manager">Store Manager</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        {/* TABLE */}
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-left">
              <thead className="bg-amber-100 text-amber-900">
                <tr>
                    <th className="px-4 py-2">Full Name</th>
                    <th className="px-4 py-2">Email</th>
                    {roleFilter === "customer" && <th className="px-4 py-2">Address</th>}
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Phone</th>
                    {roleFilter === "customer" && <th className="px-4 py-2">Status</th>}
                    <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                    const status =
                    roleFilter === "customer"
                        ? u.emailVerified
                        ? "Verified"
                        : "Unverified"
                        : null;

                    return (
                    <tr key={u.id} className="border-t">
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2">{u.email}</td>

                        {roleFilter === "customer" && (
                        <td className="px-4 py-2">{u.address || "—"}</td>
                        )}

                        <td className="px-4 py-2 capitalize">
                        {u.role.replace("-", " ")}
                        </td>

                        <td className="px-4 py-2">{u.phone || "—"}</td>

                        {roleFilter === "customer" && (
                        <td
                            className={`px-4 py-2 font-semibold ${
                            u.emailVerified ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {status}
                        </td>
                        )}

                        <td className="px-4 py-2">
                        <button
                            onClick={() => deleteUser(u.id)}
                            className="text-red-600 hover:text-red-800"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        </td>
                    </tr>
                    );
                })}
                {filteredUsers.length === 0 && (
                    <tr>
                    <td colSpan={roleFilter === "customer" ? 7 : 5} className="p-4 text-center text-gray-500">
                        No users found
                    </td>
                    </tr>
                )}
                </tbody>

            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Create User</h2>

            {error && <p className="text-red-600 mb-2">{error}</p>}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border px-3 py-2 rounded"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full border px-3 py-2 rounded"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border px-3 py-2 rounded"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full border px-3 py-2 rounded"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Phone Number (optional)"
                className="w-full border px-3 py-2 rounded"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <select
                className="w-full border px-3 py-2 rounded"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="store-manager">Store Manager</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateUser}
                className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
