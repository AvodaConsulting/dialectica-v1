import React, { useState } from 'react';
import LoaderIcon from './icons/LoaderIcon';

interface FollowUpInputProps {
    onFollowUp: (question: string) => void;
    isLoading: boolean;
}

const FollowUpInput: React.FC<FollowUpInputProps> = ({ onFollowUp, isLoading }) => {
    const [question, setQuestion] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (question.trim()) {
        onFollowUp(question);
        setQuestion('');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="relative mt-4">
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a follow-up question..." disabled={isLoading} className="w-full pl-4 pr-28 py-3 bg-base-200 border-2 border-base-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition text-content-100 placeholder-content-200" aria-label="Follow-up question" />
        <button type="submit" disabled={isLoading || !question.trim()} className="absolute inset-y-0 right-0 flex items-center justify-center w-24 text-white bg-brand-secondary rounded-full m-1.5 font-semibold hover:opacity-90 transition-opacity disabled:bg-base-300 disabled:cursor-not-allowed" aria-label="Ask">
          {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <span>Ask</span>}
        </button>
      </form>
    );
};
export default FollowUpInput;
