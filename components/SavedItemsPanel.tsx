import React from 'react';
import CloseIcon from './icons/CloseIcon';
import TrashIcon from './icons/TrashIcon';
import LibKeyLink from './LibKeyLink';
import type { SavedItem, Institution } from '../types';

interface SavedItemsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    savedItems: SavedItem[];
    onRemove: (id: string) => void;
    institution: Institution | null;
}

const SavedItemsPanel: React.FC<SavedItemsPanelProps> = ({ isOpen, onClose, savedItems, onRemove, institution }) => {
    return (
      <>
        <div className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}/>
        <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-base-100 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-base-300">
              <h2 className="text-xl font-bold">Saved Items ({savedItems.length})</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-base-200"><CloseIcon className="w-6 h-6" /></button>
            </header>
            <div className="flex-grow overflow-y-auto p-4">
              {savedItems.length === 0 ? (
                <p className="text-content-200 text-center mt-8">You haven't saved any items yet.</p>
              ) : (
                <div className="space-y-4">
                  {savedItems.map(item => (
                    <div key={item.id} className="bg-base-200 p-4 rounded-lg border border-base-300">
                      <p className="text-xs text-content-200 mb-2">From query: "{item.query}"</p>
                      <p className="font-semibold text-content-100 mb-2">{item.stance.summary}</p>
                      <blockquote className="border-l-2 border-base-300 pl-2 text-sm text-content-200 italic my-2">"{item.stance.quote}"</blockquote>
                      <div className="flex justify-between items-center mt-2">
                        <a href={`https://doi.org/${item.stance.paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary hover:underline">{item.stance.paper.authors[0]} et al. ({item.stance.paper.year})</a>
                        <div className="flex items-center gap-2">
                          {institution && <LibKeyLink doi={item.stance.paper.doi} institution={institution} variant="icon" />}
                          <button onClick={() => onRemove(item.id)} className="p-1 rounded-full text-content-200 hover:text-red-500" title="Remove saved item"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
};
export default SavedItemsPanel;
