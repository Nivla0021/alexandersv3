'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingDetailPage() {
  const { key } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const debounceRef = useRef<{ [id: string]: NodeJS.Timeout }>({});

  // Load setting values
  async function load() {
    if (!key) return;
    const res = await fetch(`/api/admin/settings/${key}`);
    const data = await res.json();
    setItems(data.value || []);
  }

  useEffect(() => {
    load();
  }, [key]);

  // Save updated values
  async function save(updated: any[]) {
    await fetch(`/api/admin/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: updated }),
    });
    setItems(updated);
  }

  // Add new item
  function addItem() {
    if (!newItem.trim()) return;
    const updated = [...items, { id: newItem, label: newItem, active: true }];
    save(updated);
    setNewItem('');
  }

  // Remove item
  function removeItem(id: string) {
    const updated = items.filter(i => i.id !== id);
    save(updated);
  }

  // Update label with debounce
  function updateLabel(id: string, label: string) {
    // Update local state immediately
    setItems(prev => prev.map(i => (i.id === id ? { ...i, label } : i)));

    // Clear previous debounce timer
    if (debounceRef.current[id]) clearTimeout(debounceRef.current[id]);

    // Set new debounce timer (500ms)
    debounceRef.current[id] = setTimeout(() => {
      const updated = items.map(i => (i.id === id ? { ...i, label } : i));
      save(updated);
      delete debounceRef.current[id];
    }, 500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <Link
            href="/admin/admin-settings"
            className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-amber-900" />
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">
            Edit Setting: {key}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Values List */}
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex gap-2 items-center">
              <input
                value={item.label}
                onChange={e => updateLabel(item.id, e.target.value)}
                className="border rounded px-3 py-2 flex-1 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                onClick={() => removeItem(item.id)}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Value */}
        <div className="flex gap-2 mt-6">
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="New value"
            className="border rounded px-3 py-2 flex-1 focus:ring-2 focus:ring-amber-500 outline-none"
          />
          <button
            onClick={addItem}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Add
          </button>
        </div>
      </main>
    </div>
  );
}
