

import React, { useState, useEffect, useMemo } from 'react';
import {
    assessRelevance,
    standardizeQuery,
    broadenQuery,
    fetchAllPapers,
    generateSynthesis,
    askFollowUp
} from './services/geminiService';
import type { Paper, AnalysisResult, SavedItem, Institution, FiltersState, FollowUp, UsageStats } from './types';

// Import Components
import ApiKeyModal from './components/ApiKeyModal';
import SearchBar from './components/SearchBar';
import QuerySuggestions from './components/QuerySuggestions';
import Filters from './components/Filters';
import SavedItemsPanel from './components/SavedItemsPanel';
import InstitutionSelector from './components/InstitutionSelector';
import ResultsDisplay from './components/ResultsDisplay';
import ThemeSwitcher from './components/ThemeSwitcher';
import BrainIcon from './components/icons/BrainIcon';
import KeyIcon from './components/icons/KeyIcon';
import LibraryIcon from './components/icons/LibraryIcon';
import BookmarkIcon from './components/icons/BookmarkIcon';
import LoaderIcon from './components/icons/LoaderIcon';

// --- Helpers & Constants ---
const GEMINI_FLASH_INPUT_PRICE_PER_1M_TOKENS = 0.35;
const GEMINI_FLASH_OUTPUT_PRICE_PER_1M_TOKENS = 0.70;
const estimateTokens = (text: string) => Math.ceil((text || '').length / 3.5);
const calculateCost = (inputTokens: number, outputTokens: number) => {
    const inputCost = (inputTokens / 1_000_000) * GEMINI_FLASH_INPUT_PRICE_PER_1M_TOKENS;
    const outputCost = (outputTokens / 1_000_000) * GEMINI_FLASH_OUTPUT_PRICE_PER_1M_TOKENS;
    return inputCost + outputCost;
};

// --- Components without dedicated files ---

const Tooltip: React.FC<{ content: React.ReactNode, children: React.ReactNode }> = ({ content, children }) => {
    return (
      <div className="relative group flex items-center">
        {children}
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-base-300 text-content-100 text-xs rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-base-300">
          {content}
        </div>
      </div>
    );
};

const CpuIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg> );
const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg> );
const HashIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg> );
const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> );
const RefreshCwIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}> <path d="M3 2v6h6" /><path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><path d="M21 22v-6h-6" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /> </svg> );
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> );
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}> <line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline> </svg> );


const UsageStatsFooter: React.FC<{ stats: UsageStats, onReset: () => void }> = ({ stats, onReset }) => {
    const StatItem = ({ icon, label, value, tooltip }: { icon: React.ReactNode, label: string, value: string, tooltip: string }) => (
      <Tooltip content={tooltip}>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xs text-content-200">{label}</p>
            <p className="font-semibold text-sm text-content-100">{value}</p>
          </div>
        </div>
      </Tooltip>
    );

    return (
      <footer className="mt-8 pt-4 border-t border-base-300">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <StatItem 
            icon={<CpuIcon className="w-6 h-6 text-brand-primary" />}
            label="LLM Model"
            value="gemini-2.5-flash"
            tooltip="The underlying Large Language Model used for analysis."
          />
          <StatItem 
            icon={<DatabaseIcon className="w-6 h-6 text-brand-primary" />}
            label="Context Window"
            value="Up to 2M tokens"
            tooltip="The model supports an expanded context window of up to 2M tokens. As a new feature, this may be in a preview or experimental stage."
          />
          <StatItem 
            icon={<HashIcon className="w-6 h-6 text-brand-secondary" />}
            label="Tokens Used"
            value={(stats.totalInputTokens + stats.totalOutputTokens).toLocaleString()}
            tooltip={`An estimate of tokens used this session. Input: ${stats.totalInputTokens.toLocaleString()}, Output: ${stats.totalOutputTokens.toLocaleString()}.`}
          />
          <StatItem 
            icon={<DollarSignIcon className="w-6 h-6 text-brand-secondary" />}
            label="Estimated Cost"
            value={`$${stats.totalCost.toFixed(6)}`}
            tooltip="An estimate based on gemini-2.5-flash pricing ($0.35/1M input, $0.70/1M output tokens). Your actual costs may vary."
          />
          <Tooltip content="Reset session token and cost counters.">
            <button onClick={onReset} className="p-2 rounded-full hover:bg-base-200 text-content-200" aria-label="Reset usage statistics">
              <RefreshCwIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </footer>
    );
};

// FIX: Removed the isLoading prop from PaperReviewScreen. It was causing a TypeScript
// error and was logically incorrect because the component unmounts when the
// analysis starts, making the loading state on its button unreachable.
// The app now relies on the dedicated LoadingScreen for the 'analyzing' state.
const PaperReviewScreen: React.FC<{ papers: Paper[], onProceed: (selectedDois: string[]) => void, onCancel: () => void, selection: Set<string>, setSelection: React.Dispatch<React.SetStateAction<Set<string>>> }> = ({ papers, onProceed, onCancel, selection, setSelection }) => {
    const [sortBy, setSortBy] = useState('relevance');

    const sortedPapers = useMemo(() => {
        const papersCopy = [...papers];
        if (sortBy === 'relevance') {
            papersCopy.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else if (sortBy === 'year') {
            papersCopy.sort((a, b) => (b.year || 0) - (a.year || 0));
        }
        return papersCopy;
    }, [papers, sortBy]);

    const handleToggleSelection = (doi: string) => {
        const newSelection = new Set(selection);
        if (newSelection.has(doi)) {
            newSelection.delete(doi);
        } else {
            newSelection.add(doi);
        }
        setSelection(newSelection);
    };
    
    const RelevanceScore = ({ score }: { score?: number }) => {
        const s = score || 0;
        return (
            <div className="flex items-center gap-1" title={`Relevance: ${s}/5`}>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= s ? 'bg-brand-primary' : 'bg-base-300'}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-content-100 mb-2">Step 2: Review & Refine Corpus</h2>
            <p className="text-content-200 mb-4">
                Found <strong>{papers.length}</strong> papers. We've pre-selected <strong>{selection.size}</strong> relevant ones. Refine the selection before generating the final analysis.
            </p>
            
            <div className="bg-base-200 p-4 rounded-lg border border-base-300">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Sort by:</span>
                        <button onClick={() => setSortBy('relevance')} className={`px-3 py-1 text-sm rounded-full ${sortBy === 'relevance' ? 'bg-brand-primary text-white' : 'bg-base-100 hover:bg-base-300'}`}>Relevance</button>
                        <button onClick={() => setSortBy('year')} className={`px-3 py-1 text-sm rounded-full ${sortBy === 'year' ? 'bg-brand-primary text-white' : 'bg-base-100 hover:bg-base-300'}`}>Year</button>
                    </div>
                </div>
                
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {sortedPapers.map(paper => {
                        const isSelected = selection.has(paper.doi);
                        return (
                            <div key={paper.doi} className={`p-3 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-base-100 border-base-300' : 'bg-base-200/50 border-transparent opacity-70 hover:opacity-100'}`}>
                                <div className="flex items-start gap-4">
                                    <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelection(paper.doi)} className="h-5 w-5 rounded border-base-300 text-brand-primary focus:ring-brand-primary mt-1 cursor-pointer"/>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-content-100">{paper.title}</p>
                                        <p className="text-xs text-content-200">{paper.authors[0]} et al. ({paper.year})</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <RelevanceScore score={paper.score} />
                                        <Tooltip content={paper.relevanceJustification || 'No justification provided.'}>
                                            <InfoIcon className="w-5 h-5 text-content-200" />
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-4">
                <button onClick={onCancel} className="px-5 py-2.5 bg-base-200 border border-base-300 rounded-full font-semibold text-content-100 hover:bg-base-300 transition-colors">
                    New Search
                </button>
                <button onClick={() => onProceed(Array.from(selection))} disabled={selection.size === 0} className="px-6 py-2.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-secondary transition-colors disabled:bg-base-300 disabled:cursor-not-allowed flex items-center gap-2">
                    <>Analyze {selection.size} Papers <ArrowRightIcon className="w-4 h-4" /></>
                </button>
            </div>
        </div>
    );
};

const LoadingScreen: React.FC<{ message: string, query: string }> = ({ message, query }) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => { setElapsedTime(prev => prev + 1); }, 1000);
        return () => window.clearInterval(interval);
    }, []);

    const formatElapsedTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
        return `${remainingSeconds}s`;
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
            <LoaderIcon className="w-12 h-12 animate-spin text-brand-primary mb-4" />
            <h2 className="text-2xl font-semibold text-content-100">{message}</h2>
            <p className="text-content-200 max-w-lg mt-2 font-medium min-h-[2.5rem] flex items-center justify-center">{query || 'Please wait...'}</p>
            <p className="text-content-200 mt-4 font-mono">Elapsed time: {formatElapsedTime(elapsedTime)}</p>
        </div>
    );
};

function App() {
    const [currentQuery, setCurrentQuery] = useState('');
    const [standardizedQuery, setStandardizedQuery] = useState('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [followUpHistory, setFollowUpHistory] = useState<FollowUp[]>([]);
    const [appStatus, setAppStatus] = useState('idle'); // 'idle', 'searching', 'reviewing', 'analyzing', 'results'
    const [papersForReview, setPapersForReview] = useState<Paper[]>([]);
    const [selection, setSelection] = useState<Set<string>>(new Set());
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FiltersState>({ 
        startYear: 2010, 
        endYear: new Date().getFullYear(),
        isOpenAccess: false,
        minCitations: 0,
        sources: {
            openAlex: true,
            semanticScholar: true,
        }
    });
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [isSavedPanelOpen, setIsSavedPanelOpen] = useState(false);
    const [institution, setInstitution] = useState<Institution | null>(null);
    const [isInstitutionSelectorOpen, setIsInstitutionSelectorOpen] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [usageStats, setUsageStats] = useState<UsageStats>({ totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 });

    useEffect(() => {
      const applyTheme = (t: string) => {
        if (t === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      };
      if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
        const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        applyTheme(theme);
      }
    }, [theme]);
    
    useEffect(() => {
      try {
          const storedItems = localStorage.getItem('dialectica-savedItems');
          if (storedItems) setSavedItems(JSON.parse(storedItems));
          const storedInstitution = localStorage.getItem('dialectica-institution');
          if (storedInstitution) setInstitution(JSON.parse(storedInstitution));
          const storedTheme = localStorage.getItem('dialectica-theme');
          if (storedTheme) setTheme(storedTheme);
          
          let envKey: string | null = null;
          if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.API_KEY) {
              envKey = process.env.API_KEY;
          }
          if (envKey) {
              setApiKey(envKey);
              return;
          }
          
          const storedApiKey = localStorage.getItem('dialectica-apiKey');
          if (storedApiKey) setApiKey(storedApiKey);
          else setIsApiKeyModalOpen(true);
      } catch (e) {
          console.error("Failed to load from local storage", e);
      }
    }, []);

    useEffect(() => { try { localStorage.setItem('dialectica-savedItems', JSON.stringify(savedItems)); } catch (e) { console.error("Failed to save items to local storage", e); } }, [savedItems]);
    useEffect(() => { try { if (institution) localStorage.setItem('dialectica-institution', JSON.stringify(institution)); else localStorage.removeItem('dialectica-institution'); } catch (e) { console.error("Failed to save institution to local storage", e); } }, [institution]);
    useEffect(() => { localStorage.setItem('dialectica-theme', theme); }, [theme]);

    const handleSaveApiKey = (key: string) => {
      const trimmedKey = key.trim();
      if (trimmedKey) {
          setApiKey(trimmedKey);
          try { localStorage.setItem('dialectica-apiKey', trimmedKey); } catch (e) { console.error("Failed to save API key", e); setError("Could not save API key."); }
          setIsApiKeyModalOpen(false);
          setError(null);
      }
    };
    
    const handleResetStats = () => setUsageStats({ totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 });

    const handleSearch = async (query: string) => {
        if (!query.trim() || !apiKey) { if (!apiKey) { setError("Please set your Gemini API key."); setIsApiKeyModalOpen(true); } return; }
        setAppStatus('searching'); 
        setError(null); 
        setAnalysisResult(null); 
        setFollowUpHistory([]); 
        setCurrentQuery(query); 
        setStandardizedQuery('');

        try {
            const MAX_SEARCH_ATTEMPTS = 3;
            setStandardizedQuery('Standardizing your research question...');
            const initialQuery = await standardizeQuery(query, apiKey);
            
            let currentSearchQuery = initialQuery;
            let papersData = { papers: [] as Paper[], openAlexCount: 0, semanticScholarCount: 0 };
            for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
                setStandardizedQuery(`Searching databases with query: "${currentSearchQuery}"`);
                papersData = await fetchAllPapers(currentSearchQuery, filters);
                if (papersData.papers.length > 0) break;
                
                if (attempt < MAX_SEARCH_ATTEMPTS) {
                    setStandardizedQuery(`No results found. Broadening query and trying again...`);
                    const broaderQuery = await broadenQuery(currentSearchQuery, apiKey);
                    if (broaderQuery === currentSearchQuery) break;
                    currentSearchQuery = broaderQuery;
                }
            }
            
            if (papersData.papers.length === 0) {
                throw new Error("No relevant papers could be found, even after broadening the search. Please try a different query or adjust the filters.");
            }

            setStandardizedQuery(`Fetched ${papersData.papers.length} papers. Assessing relevance...`);
            const assessedPapers = await assessRelevance(papersData.papers, query, apiKey);
            
            setPapersForReview(assessedPapers);
            const initialSelection = new Set(assessedPapers.filter(p => p.isRelevant).map(p => p.doi));
            setSelection(initialSelection);
            setStandardizedQuery(currentSearchQuery);
            setAppStatus('reviewing');

        } catch (err: any) { 
            setError(err.message); 
            console.error(err); 
            setAppStatus('idle');
        } 
    };

    const handleProceedToAnalysis = async (selectedDois: string[]) => {
        if (selectedDois.length === 0) {
            setError("Please select at least one paper to analyze.");
            return;
        }
        setAppStatus('analyzing');
        setError(null);
        
        try {
            if (!apiKey) throw new Error("API key is not available.");
            const selectedPapers = papersForReview.filter(p => selectedDois.includes(p.doi));
            const result = await generateSynthesis(selectedPapers, currentQuery, apiKey, setStandardizedQuery);
            
            const papersContextForTokens = selectedPapers.map(p => `Title: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}\nDOI: ${p.doi}`).join('\n\n---\n\n');
            const inputText = `Research Query: "${currentQuery}"\n\nPaper Abstracts Corpus:\n${papersContextForTokens}`;
            const outputText = JSON.stringify(result);

            const inputTokens = estimateTokens(inputText);
            const outputTokens = estimateTokens(outputText);
            const cost = calculateCost(inputTokens, outputTokens);

            setUsageStats(prev => ({
                totalInputTokens: prev.totalInputTokens + inputTokens,
                totalOutputTokens: prev.totalOutputTokens + outputTokens,
                totalCost: prev.totalCost + cost,
            }));
            
            const originallyIrrelevantPapers = papersForReview.filter(p => !p.isRelevant);
            const originalRelevantDois = new Set(papersForReview.filter(p => p.isRelevant).map(p => p.doi));
            const userDeselectedDois = [...originalRelevantDois].filter(doi => !selectedDois.includes(doi));
            const userDeselectedPapers = papersForReview.filter(p => userDeselectedDois.includes(p.doi))
                                                .map(p => ({...p, relevanceJustification: 'Manually excluded by user during review.'}));

            setAnalysisResult({ 
                ...result, 
                finalQuery: standardizedQuery,
                lowRelevancePapers: [...originallyIrrelevantPapers, ...userDeselectedPapers] 
            });
            setAppStatus('results');
            setPapersForReview([]);

        } catch (err: any) {
            setError(err.message);
            console.error(err);
            setAppStatus('reviewing');
        }
    };
    
    const handleFollowUp = async (question: string) => {
        if (!question.trim() || !analysisResult || !apiKey) { if(!apiKey) { setError("Please set your Gemini API key."); setIsApiKeyModalOpen(true); } return; }
        setIsFollowUpLoading(true); setError(null);
        try {
            const response = await askFollowUp(question, currentQuery, analysisResult.papers, apiKey);
            
            const papersContextForTokens = analysisResult.papers.map(p => `Title: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}\nDOI: ${p.doi}`).join('\n\n---\n\n');
            const inputText = `Original Query: "${currentQuery}"\n\nFollow-up Question: "${question}"\n\nAvailable Papers:\n${papersContextForTokens}`;
            const outputText = JSON.stringify(response);

            const inputTokens = estimateTokens(inputText);
            const outputTokens = estimateTokens(outputText);
            const cost = calculateCost(inputTokens, outputTokens);

            setUsageStats(prev => ({
                totalInputTokens: prev.totalInputTokens + inputTokens,
                totalOutputTokens: prev.totalOutputTokens + outputTokens,
                totalCost: prev.totalCost + cost,
            }));
            
            setFollowUpHistory(prev => [...prev, response]);
        } catch (err: any) { setError(err.message); console.error(err); } 
        finally { setIsFollowUpLoading(false); }
    }

    const handleSaveStance = (stance: any) => {
      if (!savedItems.some(item => item.id === stance.id)) {
          setSavedItems(prev => [...prev, { id: stance.id, query: currentQuery, stance: stance, savedAt: new Date().toISOString() }]);
      }
    };
    const handleRemoveSavedItem = (id: string) => setSavedItems(prev => prev.filter(item => item.id !== id));
    
    const noSourcesSelected = !filters.sources.openAlex && !filters.sources.semanticScholar;
    const isAppBusy = appStatus === 'searching' || appStatus === 'analyzing';
    const isSearchDisabled = isAppBusy || !apiKey || noSourcesSelected;

    return (
      <div className="min-h-screen bg-base-100 text-content-100 font-sans">
        <SavedItemsPanel isOpen={isSavedPanelOpen} onClose={() => setIsSavedPanelOpen(false)} savedItems={savedItems} onRemove={handleRemoveSavedItem} institution={institution} />
        <InstitutionSelector isOpen={isInstitutionSelectorOpen} onClose={() => setIsInstitutionSelectorOpen(false)} onSelect={setInstitution} currentInstitution={institution} />
        <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => { if (apiKey) setIsApiKeyModalOpen(false); }} onSave={handleSaveApiKey} />
        
        <div className="flex flex-col lg:flex-row lg:h-screen">
          {/* Left Panel */}
          <aside className="w-full lg:w-[30%] bg-base-100 lg:border-r lg:border-base-300 flex flex-col">
              <header className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-center gap-3"><BrainIcon className="w-8 h-8 text-brand-primary" /><h1 className="text-2xl font-bold text-content-100">Dialectica</h1></div>
                  <div className="flex items-center gap-2">
                      <ThemeSwitcher theme={theme} setTheme={setTheme} />
                      <button onClick={() => setIsApiKeyModalOpen(true)} className="p-2 rounded-full hover:bg-base-200" title="Set API Key"><KeyIcon className="w-6 h-6" /></button>
                      <button onClick={() => setIsInstitutionSelectorOpen(true)} className="p-2 rounded-full hover:bg-base-200" title="Select Institution"><LibraryIcon className="w-6 h-6" /></button>
                      <button onClick={() => setIsSavedPanelOpen(true)} className="relative p-2 rounded-full hover:bg-base-200" title="Saved Items">
                          <BookmarkIcon className="w-6 h-6" />
                          {savedItems.length > 0 && <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-brand-secondary text-white text-xs font-bold flex items-center justify-center">{savedItems.length}</span>}
                      </button>
                  </div>
              </header>

              <div className="flex-grow overflow-y-auto p-4 md:p-6">
                  <section>
                      <h2 className="text-2xl md:text-3xl font-bold text-content-100 mb-2">Uncover the academic dialogue.</h2>
                      <p className="text-content-200 mb-8">Ask a question to synthesize research papers and map out the points of contention.</p>
                      <SearchBar onSearch={handleSearch} isSearching={isAppBusy} disabled={isSearchDisabled} />
                      <QuerySuggestions onSuggestionClick={handleSearch} disabled={isSearchDisabled} />
                      <Filters filters={filters} setFilters={setFilters} disabled={isAppBusy || !apiKey} />
                  </section>
              </div>
              
              <footer className="p-4 border-t border-base-300 text-center text-xs text-content-200 flex-shrink-0">
                  <p>&copy; {new Date().getFullYear()} Dialectica by Andy Cheung. All rights reserved.</p>
                  <p className="mt-1">Powered by the Directed Argument Synthesis (DAS) model, invented by Andy Cheung.</p>
                  <p className="mt-2">Data from <a href="https://openalex.org/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary underline">OpenAlex</a> & <a href="https://www.semanticscholar.org/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary underline">Semantic Scholar</a>. Search also on <a href="https://www.jstor.org/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary underline">JSTOR</a>. Full-text access via <a href="https://libkey.io/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary underline">LibKey</a>.</p>
              </footer>
          </aside>

          {/* Right Panel */}
          <main className="flex-1 lg:overflow-y-auto">
              <div className="p-4 md:p-8">
                  {error && <div className="text-center p-4 bg-red-500/10 text-red-400 rounded-lg">{error}</div>}
                  
                  {appStatus === 'searching' && <LoadingScreen message="Searching databases & assessing relevance..." query={standardizedQuery} />}
                  {appStatus === 'reviewing' && (
                      <PaperReviewScreen
                          papers={papersForReview}
                          selection={selection}
                          setSelection={setSelection}
                          onProceed={handleProceedToAnalysis}
                          onCancel={() => { setAppStatus('idle'); setPapersForReview([]); setError(null); }}
                      />
                  )}
                  {appStatus === 'analyzing' && <LoadingScreen message="Synthesizing analysis from selected papers..." query={currentQuery} />}

                  {(appStatus === 'idle' || appStatus === 'results') && (
                      <ResultsDisplay 
                          result={analysisResult} 
                          onSaveStance={handleSaveStance} 
                          savedStanceIds={savedItems.map(i => i.id)} 
                          institution={institution} 
                          onFollowUp={handleFollowUp} 
                          followUpHistory={followUpHistory} 
                          isFollowUpLoading={isFollowUpLoading} 
                          standardizedQuery={analysisResult?.finalQuery || standardizedQuery}
                      />
                  )}
                  
                  {/* FIX: Changed condition to be more explicit and avoid potential TS confusion. */}
                  {(appStatus === 'idle' || appStatus === 'results') && (
                    <UsageStatsFooter stats={usageStats} onReset={handleResetStats} />
                  )}
              </div>
          </main>
        </div>
      </div>
    );
}

export default App;