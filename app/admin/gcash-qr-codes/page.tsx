// app/admin/gcash-qr-codes/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin-header';
import { 
  QrCode,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Upload,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface GCashQRCode {
  id: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  amount?: number; // Optional default amount
  description?: string;
}

export default function GCashQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<GCashQRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQr, setEditingQr] = useState<GCashQRCode | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    isActive: true,
    amount: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedQrImage, setSelectedQrImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    try {
      const response = await fetch('/api/admin/gcash-qr-codes');
      const data = await response.json();
      setQrCodes(data);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload file if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('type', 'qr-code');

        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const qrData = {
        name: formData.name,
        imageUrl,
        isActive: formData.isActive,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        description: formData.description || null,
      };

      const url = editingQr 
        ? `/api/admin/gcash-qr-codes/${editingQr.id}`
        : '/api/admin/gcash-qr-codes';
      
      const method = editingQr ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qrData),
      });

      if (!response.ok) {
        throw new Error('Failed to save QR code');
      }

      await fetchQRCodes();
      resetForm();
      setShowModal(false);
      alert(editingQr ? 'QR code updated successfully!' : 'QR code created successfully!');
    } catch (error) {
      console.error('Error saving QR code:', error);
      alert('Failed to save QR code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (qrCode: GCashQRCode) => {
    try {
      const response = await fetch(`/api/admin/gcash-qr-codes/${qrCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !qrCode.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update QR code status');
      }

      await fetchQRCodes();
    } catch (error) {
      console.error('Error toggling QR code status:', error);
      alert('Failed to update QR code status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/gcash-qr-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete QR code');
      }

      await fetchQRCodes();
      setDeleteConfirm(null);
      alert('QR code deleted successfully!');
    } catch (error) {
      console.error('Error deleting QR code:', error);
      alert('Failed to delete QR code');
    }
  };

  const resetForm = () => {
    setEditingQr(null);
    setFormData({
      name: '',
      imageUrl: '',
      isActive: true,
      amount: '',
      description: ''
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const openEditModal = (qrCode: GCashQRCode) => {
    setEditingQr(qrCode);
    setFormData({
      name: qrCode.name,
      imageUrl: qrCode.imageUrl,
      isActive: qrCode.isActive,
      amount: qrCode.amount?.toString() || '',
      description: qrCode.description || ''
    });
    setPreviewUrl(qrCode.imageUrl);
    setShowModal(true);
  };

  const downloadQRCode = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `gcash-qr-${name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <AdminHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading QR codes...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
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
              <h1 className="text-2xl font-bold text-amber-900">GCash QR Code Management</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New QR Code
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total QR Codes</p>
                <p className="text-3xl font-bold text-gray-900">{qrCodes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active QR Codes</p>
                <p className="text-3xl font-bold text-green-600">
                  {qrCodes.filter(q => q.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive QR Codes</p>
                <p className="text-3xl font-bold text-gray-400">
                  {qrCodes.filter(q => !q.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qrCode) => (
            <div
              key={qrCode.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div 
                className="relative h-48 bg-gray-100 cursor-pointer group"
                onClick={() => setSelectedQrImage(qrCode.imageUrl)}
              >
                <img
                  src={qrCode.imageUrl}
                  alt={qrCode.name}
                  className="w-full h-full object-contain p-4"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{qrCode.name}</h3>
                  {qrCode.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>

                {qrCode.amount && (
                  <p className="text-sm text-gray-600 mb-1">
                    Amount: ₱{qrCode.amount.toFixed(2)}
                  </p>
                )}

                {qrCode.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {qrCode.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(qrCode)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit QR code"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadQRCode(qrCode.imageUrl, qrCode.name)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download QR code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(qrCode)}
                      className={`p-2 rounded-lg transition-colors ${
                        qrCode.isActive 
                          ? 'text-orange-600 hover:bg-orange-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={qrCode.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {qrCode.isActive ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(qrCode.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete QR code"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(qrCode.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === qrCode.id && (
                <div className="p-3 bg-red-50 border-t border-red-100">
                  <p className="text-sm text-red-700 mb-2">Delete this QR code?</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(qrCode.id)}
                      className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {qrCodes.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first GCash QR code</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add QR Code
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingQr ? 'Edit QR Code' : 'Add New QR Code'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* QR Code Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Main GCash QR, Store Payment QR"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  {/* QR Code Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Code Image *
                    </label>
                    
                    {!previewUrl ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="qr-image-upload"
                        />
                        <label
                          htmlFor="qr-image-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload QR code image</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="QR Code Preview"
                          className="w-full h-48 object-contain border rounded-lg p-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            setFormData({ ...formData, imageUrl: '' });
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>


                  {/* Active Status */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Set as active (visible to customers)
                      </span>
                    </label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || (!formData.imageUrl && !selectedFile)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="animate-spin w-4 h-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        editingQr ? 'Update QR Code' : 'Create QR Code'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Image Viewer Modal */}
        {selectedQrImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]"
            onClick={() => setSelectedQrImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <button
                onClick={() => setSelectedQrImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <img
                src={selectedQrImage}
                alt="QR Code"
                className="w-full h-auto object-contain bg-white p-4 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                  onClick={() => {
                    const qr = qrCodes.find(q => q.imageUrl === selectedQrImage);
                    if (qr) {
                      downloadQRCode(selectedQrImage, qr.name);
                    }
                  }}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => copyToClipboard(selectedQrImage)}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}