import React, { useState } from 'react';
import LibraryIcon from './icons/LibraryIcon';
import CitationIcon from './icons/CitationIcon';
import LibKeyLink from './LibKeyLink';
import CitationModal from './CitationModal';
import type { Paper, Institution } from '../types';

interface ReferencePaperCardProps {
    paper: Paper;
    institution: Institution | null;
}

const ReferencePaperCard: React.FC<ReferencePaperCardProps> = ({ paper, institution }) => {
    const [isCiting, setIsCiting] = useState(false);
    
    return (
        <div className="bg-base-200 p-4 rounded-lg border border-base-300 flex flex-col">
            <h3 className="font-bold text-content-100">{paper.title}</h3>
            <p className="text-sm text-content-200 mt-1">{paper.authors[0]} et al. ({paper.year})</p>
            {paper.primaryInstitution && (
                <p className="text-xs text-content-200 mt-1 flex items-center gap-1.5" title={paper.primaryInstitution}>
                    <LibraryIcon className="w-3 h-3 flex-shrink-0" /> {paper.primaryInstitution}
                </p>
            )}
            <div className="flex-grow" />
            <div className="flex items-center justify-between mt-3">
                <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline">
                    View on Publisher &rarr;
                </a>
                <div className="flex items-center gap-2">
                    {institution && <LibKeyLink doi={paper.doi} institution={institution} variant="icon" />}
                    <button onClick={() => setIsCiting(true)} className="p-1 rounded-full text-content-200 hover:text-brand-primary" title="Cite this source">
                        <CitationIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {isCiting && <CitationModal paper={paper} onClose={() => setIsCiting(false)} />}
        </div>
    );
};
export default ReferencePaperCard;
