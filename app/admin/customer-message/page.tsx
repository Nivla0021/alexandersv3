'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, Search, Send, Clock, User, Phone, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function CustomerMessagePage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [searchTerm, statusFilter, messages]);

  useEffect(() => {
    if (selectedMessage) {
      setReplySubject(`Re: Contact Form Message from ${selectedMessage.name}`);
    }
  }, [selectedMessage]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/customer-messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const res = await fetch(`/api/admin/customer-messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      });

      if (res.ok) {
        // Update local state
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId && msg.status === 'new'
              ? { ...msg, status: 'read' }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        msg =>
          msg.name.toLowerCase().includes(term) ||
          msg.email.toLowerCase().includes(term) ||
          msg.message.toLowerCase().includes(term)
      );
    }

    setFilteredMessages(filtered);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replySubject || !replyBody) {
      toast.error('Please fill in subject and message', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          to: selectedMessage.email,
          subject: replySubject,
          body: replyBody,
        }),
      });

      if (res.ok) {
        toast.success('Reply sent successfully!', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontWeight: 600,
          }
        });
        setReplyBody('');
        setSelectedMessage(null);
        fetchMessages();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send reply', {
          duration: 3000,
          style: {
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
            fontWeight: 600,
          }
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard')}
            className="mb-4 hover:bg-amber-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-900 mb-2">
                Customer Messages
              </h1>
              <p className="text-gray-600">
                View and reply to customer inquiries
              </p>
            </div>
            <div className="bg-amber-600 text-white px-6 py-3 rounded-lg">
              <div className="text-2xl font-bold">{messages.length}</div>
              <div className="text-xs">Total Messages</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name, email, or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-amber-200 focus:border-amber-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'new' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('new')}
              className={statusFilter === 'new' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              New
            </Button>
            <Button
              variant={statusFilter === 'read' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('read')}
              className={statusFilter === 'read' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              Read
            </Button>
            <Button
              variant={statusFilter === 'replied' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('replied')}
              className={statusFilter === 'replied' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              Replied
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No messages found</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'new') {
                      markAsRead(msg.id);
                    }
                  }}
                  className={`bg-white rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${
                    selectedMessage?.id === msg.id
                      ? 'border-amber-400 shadow-lg'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{msg.name}</h3>
                        <p className="text-sm text-gray-500">{msg.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        msg.status === 'new'
                          ? 'bg-green-100 text-green-700'
                          : msg.status === 'read'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {msg.status === 'new' ? 'New' : msg.status === 'read' ? 'Read' : 'Replied'}
                    </span>
                  </div>

                  {msg.phone && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Phone className="w-4 h-4 mr-2" />
                      {msg.phone}
                    </div>
                  )}

                  <p className="text-gray-700 mb-3 line-clamp-2">{msg.message}</p>

                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(msg.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Detail & Reply Form */}
          <div className="bg-white rounded-lg p-6 sticky top-8">
            {selectedMessage ? (
              <>
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-amber-900 mb-4">
                    Message Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        From:
                      </label>
                      <p className="text-gray-900">{selectedMessage.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        Email:
                      </label>
                      <p className="text-gray-900">{selectedMessage.email}</p>
                    </div>

                    {selectedMessage.phone && (
                      <div>
                        <label className="text-sm font-semibold text-gray-700">
                          Phone:
                        </label>
                        <p className="text-gray-900">{selectedMessage.phone}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        Received:
                      </label>
                      <p className="text-gray-900">
                        {formatDate(selectedMessage.createdAt)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        Message:
                      </label>
                      <div className="mt-2 p-4 bg-amber-50 rounded-lg">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {selectedMessage.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply Form */}
                <div>
                  <h3 className="text-lg font-bold text-amber-900 mb-4">
                    Send Reply
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject
                      </label>
                      <Input
                        type="text"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="border-amber-200 focus:border-amber-400"
                        placeholder="Email subject"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Message
                      </label>
                      <Textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        rows={8}
                        className="border-amber-200 focus:border-amber-400 resize-none"
                        placeholder="Type your reply here..."
                      />
                    </div>

                    <Button
                      onClick={handleSendReply}
                      disabled={sending || !replySubject || !replyBody}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Select a message to view details and reply
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
