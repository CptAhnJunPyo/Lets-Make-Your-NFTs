import { useState } from 'react';
import './Modal.css';

export const TransferModal = ({ isOpen, onClose, onTransfer, nftName }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setLoading(true);
    try {
      await onTransfer(address);
      setAddress('');
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Transfer Certificate</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p>Transfer <strong>{nftName}</strong> to:</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="address-input"
              required
            />
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="confirm-btn">
                {loading ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const RevokeModal = ({ isOpen, onClose, onRevoke, nftName }) => {
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await onRevoke();
      onClose();
    } catch (error) {
      console.error('Revoke failed:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Revoke Certificate</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="warning-icon">⚠️</div>
          <p>Are you sure you want to permanently revoke:</p>
          <strong>{nftName}</strong>
          <p className="warning-text">This action cannot be undone!</p>
          
          <div className="modal-actions">
            <button onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleRevoke} disabled={loading} className="revoke-btn">
              {loading ? 'Revoking...' : 'Revoke Certificate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};