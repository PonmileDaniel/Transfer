import React, { useState } from 'react';
import { CreditCard, Mail, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { paymentAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'NGN',
    email: '',
    customerName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const currencies = [
    { value: 'NGN', label: 'Nigerian Naira (NGN)', provider: 'Paystack' },
    { value: 'USD', label: 'US Dollar (USD)', provider: 'Flutterwave' },
    { value: 'GHS', label: 'Ghanaian Cedi (GHS)', provider: 'Flutterwave' },
    { value: 'KES', label: 'Kenyan Shilling (KES)', provider: 'Flutterwave' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (!formData.email) {
      setError('Please enter your email address');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        email: formData.email,
        metadata: {
          customerName: formData.customerName || 'Customer'
        }
      };
      
      const response = await paymentAPI.createPayment(paymentData);
      
      if (response.success) {
        setSuccess(response.data);
        // Redirect to payment provider
        window.open(response.data.authorizationUrl, '_blank');
      } else {
        setError(response.message || 'Payment creation failed');
      }
    } catch (err) {
      console.error('Payment creation error:', err);
      setError(err.message || 'An error occurred while creating payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = currencies.find(c => c.value === formData.currency);

  if (success) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="success-message">
            <CheckCircle size={48} className="success-icon" />
            <h3>Payment Created Successfully!</h3>
            <p>Your payment has been initialized. You should be redirected to complete the payment.</p>
            
            <div className="payment-details">
              <div className="detail-item">
                <strong>Amount:</strong> {success.currency} {success.amount.toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>Reference:</strong> {success.reference}
              </div>
              <div className="detail-item">
                <strong>Provider:</strong> {success.provider}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> 
                <span className={`status-badge status-${success.status}`}>
                  {success.status}
                </span>
              </div>
            </div>
            
            <div className="success-actions">
              <a 
                href={success.authorizationUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <CreditCard size={18} />
                Complete Payment
              </a>
              <button 
                onClick={() => setSuccess(null)}
                className="btn btn-secondary"
              >
                Create Another Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <CreditCard size={24} />
          Create Payment
        </h2>
      </div>
      
      <div className="card-body">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <DollarSign size={16} />
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter amount"
              min="1"
              step="0.01"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="form-select"
            >
              {currencies.map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
            {selectedCurrency && (
              <div className="currency-info">
                <small>
                  Payments in {selectedCurrency.value} will be processed via {selectedCurrency.provider}
                </small>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Customer Name (Optional)</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your name"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? (
              <LoadingSpinner text="Creating Payment..." />
            ) : (
              <>
                <CreditCard size={18} />
                Create Payment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;