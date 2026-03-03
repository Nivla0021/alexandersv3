'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [newKey, setNewKey] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  async function load() {
    const res = await fetch('/api/admin/settings');
    const data = await res.json();
    setSettings(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addSetting() {
    if (!newKey.trim()) return;
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey, value: [] }),
    });
    setNewKey('');
    load();
  }

  async function deleteSetting(key: string) {
    if (!confirm(`Delete setting "${key}"?`)) return;
    await fetch(`/api/admin/settings/${key}`, { method: 'DELETE' });
    load();
  }

  async function saveKey(oldKey: string) {
    if (!editingValue.trim()) return;
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldKey, newKey: editingValue }),
    });
    setEditingKey(null);
    setEditingValue('');
    load();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <Link
            href="/admin/dashboard"
            className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-amber-900" />
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Add New Setting */}
        <div className="flex gap-2 mb-6">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="New setting key (ex: categories)"
            className="border rounded px-3 py-2 flex-1 focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            onClick={addSetting}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {/* Settings List */}
        <div className="grid md:grid-cols-2 gap-4">
            {settings.map((setting) =>
                editingKey === setting.key ? (
                <div key={setting.key} className="bg-white p-4 rounded-xl shadow-md">
                    {/* Editing mode */}
                    <div className="flex gap-2">
                    <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="border rounded px-3 py-2 flex-1 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button
                        onClick={() => saveKey(setting.key)}
                        className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"
                    >
                        <Save size={16} /> Save
                    </button>
                    <button
                        onClick={() => setEditingKey(null)}
                        className="px-3 py-2 bg-gray-300 rounded flex items-center gap-1 hover:bg-gray-400 transition-colors"
                    >
                        <X size={16} /> Cancel
                    </button>
                    </div>
                </div>
                ) : (
                <Link
                    key={setting.key}
                    href={`/admin/admin-settings/${setting.key}`}
                    className="block bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                >
                    <div className="font-semibold text-lg text-amber-900">{setting.key}</div>
                    <p className="text-sm text-gray-500">Manage values</p>

                    <div className="flex gap-2 mt-3">
                    <button
                        onClick={(e) => {
                        e.preventDefault(); // Prevent the card click from navigating
                        setEditingKey(setting.key);
                        setEditingValue(setting.key);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 transition-colors"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    <button
                        onClick={(e) => {
                        e.preventDefault(); // Prevent the card click from navigating
                        deleteSetting(setting.key);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-1 hover:bg-red-700 transition-colors"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                    </div>
                </Link>
                )
            )}
            </div>
      </main>
    </div>
  );
}
