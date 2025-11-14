import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');

    if (!isOpen) {
      return null;
    }

    const handleSave = () => {
      if (key.trim()) {
        onSave(key);
      }
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSave();
    };

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-base-200" aria-label="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 id="api-key-modal-title" className="text-xl font-bold mb-4 text-content-100">Set Gemini API Key</h2>
          <p className="text-sm text-content-200 mb-4">
            To use Dialectica, you need to provide your own Google Gemini API key. You can get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">Google AI Studio</a>.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Enter your API key" className="w-full p-3 bg-base-200 border border-base-300 rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none text-content-100" aria-label="Gemini API Key"/>
            <button type="submit" disabled={!key.trim()} className="w-full p-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed">Save and Continue</button>
          </form>
          <p className="text-xs text-content-200 mt-4 text-center">Your key is stored in your browser's local storage and is not sent to our servers.</p>
        </div>
      </div>
    );
};
export default ApiKeyModal;
