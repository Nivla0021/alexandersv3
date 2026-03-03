"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PlusCircle,
  Trash2,
  Edit,
  HelpCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<any | null>(null);

  async function loadFaqs() {
    setLoading(true);
    const res = await fetch("/api/admin/faq");
    const data = await res.json();
    setFaqs(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  async function handleCreate(e: any) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/faq", {
      method: "POST",
      body: JSON.stringify({ question, answer }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }

    setQuestion("");
    setAnswer("");
    loadFaqs();
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setError("");

    const res = await fetch(`/api/admin/faq/${editing.id}`, {
      method: "PUT",
      body: JSON.stringify(editing),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }

    setEditing(null);
    loadFaqs();
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    loadFaqs();
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-amber-900" />
              </Link>
              <h1 className="text-2xl font-bold text-amber-900">
                Frequently Asked Questions (FAQ) Management
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold text-amber-900 mb-6 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-amber-600" />
          Manage FAQ
        </h1>

        {/* CREATE FAQ */}
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-amber-200"
        >
          <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-amber-600" />
            Add New FAQ
          </h2>

          {error && (
            <p className="text-red-600 mb-3 font-medium">{error}</p>
          )}

          <div className="mb-4">
            <label className="block font-semibold text-amber-900 mb-1">
              Question
            </label>
            <input
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 ring-amber-600 outline-none"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter FAQ question"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold text-amber-900 mb-1">
              Answer
            </label>
            <textarea
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 ring-amber-600 outline-none"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write the answer here"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-amber-600 text-white rounded-lg shadow hover:bg-amber-700 font-semibold"
          >
            Add FAQ
          </button>
        </form>

        {/* FAQ LIST */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-200">
          <h2 className="text-xl font-bold text-amber-900 mb-4">
            FAQ List
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-amber-600" />
            </div>
          ) : faqs.length === 0 ? (
            <p className="text-gray-600 italic text-center py-6">
              No FAQs added yet.
            </p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-5 border rounded-lg bg-amber-50 hover:bg-amber-100 transition shadow"
                >
                  <p className="font-bold text-amber-900">{faq.question}</p>
                  <p className="text-gray-700 mt-1">{faq.answer}</p>

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setEditing(faq)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EDIT MODAL */}
        {editing && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-amber-900 mb-4">
                Edit FAQ
              </h3>

              {error && (
                <p className="text-red-600 mb-3 font-medium">{error}</p>
              )}

              <input
                className="w-full p-3 mb-3 rounded-lg border border-gray-300 focus:ring-2 ring-amber-600"
                value={editing.question}
                onChange={(e) =>
                  setEditing({ ...editing, question: e.target.value })
                }
              />

              <textarea
                rows={4}
                className="w-full p-3 mb-3 rounded-lg border border-gray-300 focus:ring-2 ring-amber-600"
                value={editing.answer}
                onChange={(e) =>
                  setEditing({ ...editing, answer: e.target.value })
                }
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
