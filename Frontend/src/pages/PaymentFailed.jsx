import React, { useState, useEffect } from 'react';
import { XCircle, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

const PaymentFailed = () => {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('reference');
    const errorMsg = urlParams.get('error');
    
    setReference(ref || 'Unknown');
    setError(decodeURIComponent(errorMsg || 'Payment failed'));
  }, []);

  const goHome = () => {
    window.location.href = '/';
  };

  const tryAgain = () => {
    window.location.href = '/#payment-form';
  };

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-body">
          <div className="failed-page">
            <div className="failed-header">
              <XCircle size={64} className="failed-icon" />
              <h2>Payment Failed</h2>
              <p>Unfortunately, your payment could not be processed.</p>
            </div>

            <div className="error-details">
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>

              {reference !== 'Unknown' && (
                <div className="reference-info">
                  <strong>Reference:</strong> {reference}
                </div>
              )}
            </div>

            <div className="troubleshooting">
              <h4>What can you do?</h4>
              <ul className="troubleshooting-list">
                <li>Check if you have sufficient funds in your account</li>
                <li>Verify your card details are correct</li>
                <li>Try using a different payment method</li>
                <li>Contact your bank if the issue persists</li>
              </ul>
            </div>

            <div className="failed-actions">
              <button onClick={tryAgain} className="btn btn-primary">
                <RefreshCw size={18} />
                Try Again
              </button>
              <button onClick={goHome} className="btn btn-secondary">
                <ArrowLeft size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;