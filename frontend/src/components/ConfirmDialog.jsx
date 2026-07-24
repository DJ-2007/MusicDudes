import React from 'react';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function ConfirmDialog({ isOpen, title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div 
        className={`confirm-container ${type}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icon-wrap">
          {type === 'warning' ? <FaExclamationTriangle /> : <FaInfoCircle />}
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button 
            type="button" 
            className="confirm-btn confirm-btn-cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="confirm-btn confirm-btn-confirm" 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
