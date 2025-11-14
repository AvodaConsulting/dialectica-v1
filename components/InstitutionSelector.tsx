import React, { useState, useMemo } from 'react';
import SearchIcon from './icons/SearchIcon';
import CloseIcon from './icons/CloseIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { institutions } from '../data/institutions';
import type { Institution } from '../types';

interface InstitutionSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (institution: Institution | null) => void;
    currentInstitution: Institution | null;
}

const InstitutionSelector: React.FC<InstitutionSelectorProps> = ({ isOpen, onClose, onSelect, currentInstitution }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [customName, setCustomName] = useState('');
    const [customId, setCustomId] = useState('');

    const suggestedInstitutions = [
      { id: '4503', name: 'The Chinese University of Hong Kong (CUHK)' },
      { id: '1434', name: 'Harvard University' },
      { id: '1459', name: 'University of Oxford' },
      { id: '1721', name: 'National University of Singapore (NUS)' },
      { id: '1439', name: 'Stanford University' },
      { id: '2532', name: 'ETH Zurich' },
    ];

    const filteredInstitutions = useMemo(() => {
      if (!searchTerm.trim()) return [];
      return institutions.filter(inst => inst.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm]);

    const handleSelect = (institution: Institution) => {
      onSelect(institution);
      onClose();
    };
    
    const handleCustomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (customName.trim() && customId.trim()) {
            handleSelect({ name: customName, id: customId });
        }
    };

    const handleDeselect = () => {
      onSelect(null);
      onClose();
    };

    if (!isOpen) return null;

    return (
      <>
        <div className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} aria-hidden="true"/>
        <div role="dialog" aria-modal="true" aria-labelledby="institution-selector-title" className={`fixed top-0 right-0 h-full w-full max-w-md bg-base-100 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-base-300">
              <h2 id="institution-selector-title" className="text-xl font-bold">Select Your Institution</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-base-200" aria-label="Close"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <div className="p-4 border-b border-base-300">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-200 pointer-events-none" />
                <input type="text" placeholder="Search for your institution..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-base-200 border border-base-300 rounded-lg focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none" aria-label="Search for your institution"/>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              {searchTerm.trim() === '' && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-content-200 px-3 mb-2">Suggestions</h3>
                  <ul className="space-y-2">
                    {suggestedInstitutions.map(inst => (
                      <li key={inst.id}>
                        <button onClick={() => handleSelect(inst)} className="w-full text-left p-3 rounded-lg hover:bg-base-200 flex justify-between items-center transition-colors">
                          <span>{inst.name}</span>
                          {currentInstitution?.id === inst.id && <CheckCircleIcon className="w-5 h-5 text-brand-primary" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {searchTerm.trim() !== '' && filteredInstitutions.length > 0 && (
                  <ul className="space-y-2">
                    {filteredInstitutions.map(inst => (
                      <li key={inst.id}>
                        <button onClick={() => handleSelect(inst)} className="w-full text-left p-3 rounded-lg hover:bg-base-200 flex justify-between items-center transition-colors">
                          <span>{inst.name}</span>
                          {currentInstitution?.id === inst.id && <CheckCircleIcon className="w-5 h-5 text-brand-primary" />}
                        </button>
                      </li>
                    ))}
                  </ul>
              )}
              {searchTerm.trim() !== '' && filteredInstitutions.length === 0 && (
                  <div className="text-center p-4 bg-base-200 rounded-lg">
                      <h3 className="font-semibold text-content-100">Can't find your institution?</h3>
                      <p className="text-sm text-content-200 mt-1 mb-4">Add it manually by providing its name and LibKey ID.</p>
                      <form onSubmit={handleCustomSubmit} className="space-y-3 text-left">
                          <input type="text" placeholder="Institution Name" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full p-2 bg-base-100 border border-base-300 rounded-md" required />
                          <input type="text" placeholder="LibKey ID (e.g., 1234)" value={customId} onChange={e => setCustomId(e.target.value)} className="w-full p-2 bg-base-100 border border-base-300 rounded-md" required />
                          <button type="submit" className="w-full p-2 bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-secondary">Save Custom Institution</button>
                      </form>
                  </div>
              )}
            </div>
            {currentInstitution && (
              <footer className="p-4 border-t border-base-300">
                <button onClick={handleDeselect} className="w-full p-2 rounded-lg bg-base-200 hover:bg-base-300 text-content-100 font-semibold">Clear Selection</button>
              </footer>
            )}
          </div>
        </div>
      </>
    );
};
export default InstitutionSelector;
