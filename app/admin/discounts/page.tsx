'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Tag, Search, Filter, ChevronLeft, ChevronRight, 
  CheckCircle, XCircle, Clock, Eye, Calendar, 
  User, Mail, Phone, Hash, Download, X, Loader2,
  AlertCircle, CheckCheck, ArrowLeft, Image as ImageIcon,
  Cake, IdCard
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-header';

interface DiscountApplication {
  id: string;
  discountType: 'PWD' | 'SENIOR';
  birthday: string;
  idNumber: string;
  idImageUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isApproved: boolean;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  order?: {
    id: string;
    orderNumber: string;
    total: number;
  } | null;
}

export default function AdminDiscountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<DiscountApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState<DiscountApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Add ESC key handler for image modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
        setSelectedImage('');
      }
    };

    window.addEventListener('keydown', handleEscKey);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showImageModal]);

  // Prevent body scroll when image modal is open
  useEffect(() => {
    if (showImageModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || (session?.user as any)?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    fetchApplications();
  }, [status, session, router, filter, page]);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/discounts?status=${filter}&page=${page}&limit=10`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      setApplications(data.applications || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (app: DiscountApplication) => {
    setSelectedApp(app);
    setShowModal(true);
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setError('');
    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      // Refresh applications
      await fetchApplications();
      setShowModal(false);
      setSelectedApp(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setProcessingId(id);
    setError('');
    try {
      const response = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'REJECT',
          rejectionReason 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      // Refresh applications
      await fetchApplications();
      setShowRejectModal(false);
      setShowModal(false);
      setSelectedApp(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = applications.filter(app => 
    app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <AdminHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <AdminHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center text-gray-600 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-900 flex items-center">
                <Tag className="w-8 h-8 mr-3 text-amber-600" />
                Discount Approvals
              </h1>
              <p className="text-gray-600 mt-2">
                Review and approve PWD/Senior Citizen discount applications
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    filter === 'PENDING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('APPROVED')}
                  className={`px-4 py-2 text-sm font-medium ${
                    filter === 'APPROVED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilter('REJECTED')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    filter === 'REJECTED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full md:w-80"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600">
                {filter === 'PENDING' 
                  ? 'No pending discount applications to review.'
                  : `No ${filter.toLowerCase()} discount applications.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{app.user.name}</p>
                          <p className="text-sm text-gray-600">{app.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.discountType === 'PWD' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {app.discountType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {app.idNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(app)}
                          className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredApplications.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showModal && selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-amber-600" />
                    Discount Application Details
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    {getStatusBadge(selectedApp.status)}
                    {selectedApp.reviewedAt && (
                      <p className="text-sm text-gray-500">
                        Reviewed on {formatDate(selectedApp.reviewedAt)}
                      </p>
                    )}
                  </div>

                  {/* User Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-600" />
                      Applicant Information
                    </h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-sm">
                        <User className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-gray-700">{selectedApp.user.name}</span>
                      </p>
                      <p className="flex items-center text-sm">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-gray-700">{selectedApp.user.email}</span>
                      </p>
                      {selectedApp.user.phone && (
                        <p className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-700">{selectedApp.user.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Discount Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Tag className="w-4 h-4 mr-2 text-gray-600" />
                      Discount Information
                    </h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-sm">
                        <span className="font-medium text-gray-600 w-24">Type:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedApp.discountType === 'PWD' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {selectedApp.discountType}
                        </span>
                      </p>
                      <p className="flex items-center text-sm">
                        <Cake className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-600">Birthday:</span>
                        <span className="ml-2 text-gray-700">
                          {formatDate(selectedApp.birthday)} 
                          <span className="text-gray-500 ml-2">
                            (Age: {calculateAge(selectedApp.birthday)})
                          </span>
                        </span>
                      </p>
                      <p className="flex items-center text-sm">
                        <IdCard className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium text-gray-600">ID Number:</span>
                        <span className="ml-2 text-gray-700">{selectedApp.idNumber}</span>
                      </p>
                    </div>
                  </div>

                  {/* ID Image */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2 text-gray-600" />
                      ID Image
                    </h3>
                    <div 
                      className="relative h-48 bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-2 border-gray-300"
                      onClick={() => {
                        if (selectedApp?.idImageUrl) {
                          setSelectedImage(selectedApp.idImageUrl);
                          setShowImageModal(true);
                        }
                      }}
                    >
                      {selectedApp?.idImageUrl ? (
                        <>
                          <img
                            src={selectedApp.idImageUrl}
                            alt="ID"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Handle image loading error
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-all">
                            <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 hover:opacity-100 transition-opacity">
                              Click to enlarge
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-400">No image available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason (if rejected) */}
                  {selectedApp.status === 'REJECTED' && selectedApp.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-2 flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejection Reason
                      </h3>
                      <p className="text-red-700 text-sm">{selectedApp.rejectionReason}</p>
                    </div>
                  )}

                  {/* Action Buttons (only for pending) */}
                  {selectedApp.status === 'PENDING' && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => handleApprove(selectedApp.id)}
                        disabled={processingId === selectedApp.id}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processingId === selectedApp.id ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Approve Application
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={processingId === selectedApp.id}
                        className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Reject Application</h3>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                      setError('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this discount application.
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Invalid ID, Age not qualified, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                />

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                      setError('');
                    }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedApp && handleReject(selectedApp.id)}
                    disabled={processingId === selectedApp?.id || !rejectionReason.trim()}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processingId === selectedApp?.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Reject'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal - Updated with better UX */}
        {showImageModal && selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[70]"
            onClick={() => {
              setShowImageModal(false);
              setSelectedImage('');
            }}
          >
            <div 
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
            >
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage('');
                }}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors z-10"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="ID Full Size"
                  className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    // Handle image loading error
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                  }}
                />
              </div>
              <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                Click outside or press ESC to close
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}