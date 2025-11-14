import React, { useState } from 'react';
import CloseIcon from './icons/CloseIcon';
import CopyIcon from './icons/CopyIcon';
import type { Paper } from '../types';

interface CitationModalProps {
    paper: Paper;
    onClose: () => void;
}

const CitationModal: React.FC<CitationModalProps> = ({ paper, onClose }) => {
    const [copied, setCopied] = useState('');
    
    const formatAuthors = (authors: string[]) => {
      if (authors.length === 0) return '';
      if (authors.length === 1) return authors[0];
      if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
      return `${authors[0]} et al.`;
    };

    const citations = {
      APA: `${formatAuthors(paper.authors)}. (${paper.year}). ${paper.title}. https://doi.org/${paper.doi}`,
      MLA: `${formatAuthors(paper.authors)}. "${paper.title}." ${paper.year}, doi:${paper.doi}.`,
      Chicago: `${formatAuthors(paper.authors)}. ${paper.year}. "${paper.title}." https://doi.org/${paper.doi}.`,
    };

    const handleCopy = (text: string, format: string) => {
      navigator.clipboard.writeText(text);
      setCopied(format);
      setTimeout(() => setCopied(''), 2000);
    };

    return (
      <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-base-200"><CloseIcon className="w-6 h-6" /></button>
          <h2 className="text-xl font-bold mb-4">Cite Source</h2>
          <div className="space-y-4">
            {Object.entries(citations).map(([format, text]) => (
              <div key={format}>
                <h3 className="font-semibold mb-1">{format}</h3>
                <div className="relative bg-base-200 p-3 rounded-md text-sm">
                  <p className="pr-10">{text}</p>
                  <button onClick={() => handleCopy(text, format)} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-md hover:bg-base-300" title={`Copy ${format} citation`}>
                    {copied === format ? <span className="text-xs text-green-500">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
};
export default CitationModal;
