import React from 'react';
import LibraryIcon from './icons/LibraryIcon';
import LibKeyLink from './LibKeyLink';
import type { KeyPaper, Institution } from '../types';

interface KeyPapersProps {
    papers: KeyPaper[];
    institution: Institution | null;
}

const KeyPapers: React.FC<KeyPapersProps> = ({ papers, institution }) => {
    if (!papers || papers.length === 0) return null;
    return (
        <section>
            <h2 className="text-2xl font-bold text-content-100 mb-4">Key Papers in the Debate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {papers.map(({ paper, rationale }, index) => (
                    <div key={index} className="bg-base-200 p-4 rounded-lg border border-base-300 flex flex-col">
                        <h3 className="font-bold text-content-100">{paper.title}</h3>
                        <p className="text-sm text-content-200 mt-1">{paper.authors[0]} et al. ({paper.year})</p>
                        {paper.primaryInstitution && (
                            <p className="text-xs text-content-200 mt-1 mb-2 truncate flex items-center gap-1.5" title={paper.primaryInstitution}>
                                <LibraryIcon className="w-3 h-3 flex-shrink-0" /> {paper.primaryInstitution}
                            </p>
                        )}
                        <p className="text-sm text-content-100 flex-grow mb-3"><strong>Why it's key:</strong> {rationale}</p>
                        <div className="flex items-center gap-4">
                            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline self-start">View on Publisher &rarr;</a>
                          {institution && <LibKeyLink doi={paper.doi} institution={institution} />}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
};
export default KeyPapers;
