import React, { useState, useEffect } from 'react';
import { CheckCircle, Copy, ArrowLeft, RefreshCw } from 'lucide-react';
import { paymentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentSuccess = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    
    if (reference) {
      verifyPayment(reference);
    } else {
      setError('No payment reference found');
      setLoading(false);
    }
  }, []);

  const verifyPayment = async (reference) => {
    try {
      const response = await paymentAPI.verifyPayment(reference);
      if (response.success) {
        setPaymentData(response.data);
      } else {
        setError(response.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const copyReference = () => {
    if (paymentData?.reference) {
      navigator.clipboard.writeText(paymentData.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const goHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '60px' }}>
        <LoadingSpinner text="Verifying payment..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '60px' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="card-body">
            <div className="error-state">
              <div className="error-icon">❌</div>
              <h3>Verification Error</h3>
              <p>{error}</p>
              <button onClick={goHome} className="btn btn-primary">
                <ArrowLeft size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-body">
          <div className="success-page">
            <div className="success-header">
              <CheckCircle size={64} className="success-icon" />
              <h2>Payment Successful! 🎉</h2>
              <p>Your payment has been processed successfully.</p>
            </div>

            <div className="payment-summary">
              <div className="summary-row">
                <span className="summary-label">Amount Paid:</span>
                <span className="summary-value amount">
                  {paymentData.currency} {formatAmount(paymentData.amount, paymentData.currency)}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Payment Reference:</span>
                <div className="reference-container">
                  <span className="summary-value">{paymentData.reference}</span>
                  <button
                    onClick={copyReference}
                    className="copy-btn"
                    title="Copy reference"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="summary-row">
                <span className="summary-label">Payment Provider:</span>
                <span className="summary-value provider">
                  {paymentData.provider === 'paystack' ? 'Paystack' : 'Flutterwave'}
                </span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Status:</span>
                <span className={`status-badge status-${paymentData.status}`}>
                  <CheckCircle size={12} />
                  {paymentData.status}
                </span>
              </div>

              {paymentData.paidAt && (
                <div className="summary-row">
                  <span className="summary-label">Paid At:</span>
                  <span className="summary-value">
                    {new Date(paymentData.paidAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {copied && (
              <div className="copy-notification">
                Reference copied to clipboard!
              </div>
            )}

            <div className="success-actions">
              <button onClick={goHome} className="btn btn-primary">
                <ArrowLeft size={18} />
                Continue Shopping
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;