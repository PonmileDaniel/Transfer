import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { paymentAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusIcons = {
    pending: Clock,
    initialized: Loader,
    completed: CheckCircle,
    failed: XCircle
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (searchEmail.trim()) {
        response = await paymentAPI.getPaymentsByEmail(searchEmail.trim());
      } else if (statusFilter !== 'all') {
        response = await paymentAPI.getPaymentsByStatus(statusFilter);
      } else {
        response = await paymentAPI.getAllPayments(20, 0);
      }
      
      if (response.success) {
        const payments = response.data || [];
        
        
        const updatedPayments = [];
        for (const payment of payments) {
          if (payment.status === 'initialized') {
            try {
              // Verify each initialized payment
              const verifyResponse = await paymentAPI.verifyPayment(payment.reference);
              if (verifyResponse.success) {
                // Use updated payment data
                updatedPayments.push({
                  ...payment,
                  status: verifyResponse.data.status
                });
              } else {
                updatedPayments.push(payment);
              }
            } catch (err) {
              console.error(`Failed to verify payment ${payment.reference}:`, err);
              updatedPayments.push(payment);
            }
          } else {
            updatedPayments.push(payment);
          }
        }
        
        setPayments(updatedPayments);
      } else {
        setError(response.message || 'Failed to fetch payments');
        setPayments([]);
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError(err.message || 'Failed to fetch payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <History size={24} />
          Payment History
        </h2>
      </div>
      
      <div className="card-body">
        {/* Search and Filter Controls */}
        <div className="search-controls">
          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Search by email address..."
                className="form-input"
              />
              <button type="submit" className="btn btn-primary">
                <Search size={18} />
                Search
              </button>
            </div>
          </form>
          
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="initialized">Initialized</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            <button onClick={fetchPayments} className="btn btn-secondary">
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Loading payments..." />
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <History size={48} />
            <h3>No Payments Found</h3>
            <p>No payment records match your current filters.</p>
          </div>
        ) : (
          <div className="payments-table">
            {payments.map((payment) => {
              const StatusIcon = statusIcons[payment.status] || Clock;
              
              return (
                <div key={payment.id} className="payment-row">
                  <div className="payment-info">
                    <div className="payment-header">
                      <span className="payment-reference">{payment.reference}</span>
                      <span className={`status-badge status-${payment.status}`}>
                        <StatusIcon size={12} />
                        {payment.status}
                      </span>
                    </div>
                    
                    <div className="payment-details">
                      <div className="detail-group">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value">
                          {payment.currency} {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </div>
                      
                      <div className="detail-group">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{payment.email}</span>
                      </div>
                      
                      <div className="detail-group">
                        <span className="detail-label">Provider:</span>
                        <span className="detail-value">{payment.provider}</span>
                      </div>
                      
                      <div className="detail-group">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(payment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="payment-actions">
                    {payment.status === 'initialized' && payment.authorizationUrl && (
                      <a
                        href={payment.authorizationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        Complete Payment
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;