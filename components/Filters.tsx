import React from 'react';
import type { FiltersState } from '../types';

interface FiltersProps {
    filters: FiltersState;
    setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
    disabled: boolean;
}

const Filters: React.FC<FiltersProps> = ({ filters, setFilters, disabled }) => {
    const handleYearChange = (field: 'startYear' | 'endYear', value: string) => {
      const year = value === '' ? '' : parseInt(value, 10);
      if (!isNaN(year as number)) {
        setFilters({ ...filters, [field]: year });
      }
    };

    const handleCitationsChange = (value: string) => {
      const citations = value === '' ? 0 : parseInt(value, 10);
      if (!isNaN(citations) && citations >= 0) {
        setFilters({ ...filters, minCitations: citations });
      }
    };

    const handleSourceChange = (sourceName: 'openAlex' | 'semanticScholar', isChecked: boolean) => {
        setFilters(prev => ({
            ...prev,
            sources: {
                ...prev.sources,
                [sourceName]: isChecked,
            }
        }));
    };
    
    const handleReset = () => {
      setFilters({
        startYear: 2010,
        endYear: new Date().getFullYear(),
        isOpenAccess: false,
        minCitations: 0,
        sources: { openAlex: true, semanticScholar: true }
      });
    };

    const noSourcesSelected = !filters.sources.openAlex && !filters.sources.semanticScholar;

    return (
      <div className="mt-6 p-4 bg-base-200 rounded-lg border border-base-300 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-content-100">Advanced Search Filters</h3>
            <button onClick={handleReset} disabled={disabled} className="text-sm text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">Reset</button>
        </div>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-content-100 text-sm">Publication Year</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Start" value={filters.startYear} onChange={(e) => handleYearChange('startYear', e.target.value)} disabled={disabled} className="w-full bg-base-100 border border-base-300 rounded-md p-2 text-center focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none" aria-label="Start year"/>
                <span>-</span>
                <input type="number" placeholder="End" value={filters.endYear} onChange={(e) => handleYearChange('endYear', e.target.value)} disabled={disabled} className="w-full bg-base-100 border border-base-300 rounded-md p-2 text-center focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none" aria-label="End year"/>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="min-citations" className="font-semibold text-content-100 text-sm">Minimum Citations</label>
              <input id="min-citations" type="number" value={filters.minCitations} onChange={(e) => handleCitationsChange(e.target.value)} disabled={disabled} min="0" className="w-full bg-base-100 border border-base-300 rounded-md p-2 text-center focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none" aria-label="Minimum citations"/>
            </div>
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 flex items-center justify-center pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={filters.isOpenAccess} onChange={(e) => setFilters({ ...filters, isOpenAccess: e.target.checked })} disabled={disabled} className="h-5 w-5 rounded border-base-300 text-brand-primary focus:ring-brand-primary cursor-pointer"/>
                  <span className="font-semibold text-content-100">Open Access Only</span>
              </label>
            </div>
          </div>
          <div className="border-t border-base-300 pt-4 mt-4">
            <h4 className="font-semibold text-content-100 text-sm mb-2 text-center">Data Sources for Analysis</h4>
            <div className="flex items-center justify-around">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={filters.sources.openAlex} onChange={(e) => handleSourceChange('openAlex', e.target.checked)} disabled={disabled} className="h-5 w-5 rounded border-base-300 text-brand-primary focus:ring-brand-primary cursor-pointer"/>
                    <span className="font-semibold text-content-100">OpenAlex</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={filters.sources.semanticScholar} onChange={(e) => handleSourceChange('semanticScholar', e.target.checked)} disabled={disabled} className="h-5 w-5 rounded border-base-300 text-brand-primary focus:ring-brand-primary cursor-pointer"/>
                    <span className="font-semibold text-content-100">Semantic Scholar</span>
                </label>
            </div>
            {noSourcesSelected && (
                <p className="text-center text-xs text-red-500 mt-2">Please select at least one data source to perform an analysis.</p>
            )}
          </div>
          <div className="border-t border-base-300 pt-4 mt-4">
            <h4 className="font-semibold text-content-100 text-sm mb-2 text-center">Integrated Tools</h4>
             <div className="text-xs text-content-200 space-y-2 text-center">
                <p>
                    <strong className="text-content-100">JSTOR:</strong> A button to search your query on JSTOR.org appears after analysis is complete.
                </p>
                <p>
                    <strong className="text-content-100">LibKey:</strong> Links to find full-text PDFs appear once you select an institution.
                </p>
            </div>
          </div>
        </div>
      </div>
    );
};
export default Filters;
