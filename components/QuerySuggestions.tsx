import React from 'react';

interface QuerySuggestionsProps {
    onSuggestionClick: (suggestion: string) => void;
    disabled: boolean;
}

const QuerySuggestions: React.FC<QuerySuggestionsProps> = ({ onSuggestionClick, disabled }) => {
    const suggestions = [
      "What is the academic consensus on the effectiveness of cognitive behavioral therapy for depression?",
      "Debates on the 'Mozart effect': Is there evidence for music enhancing cognitive function?",
      "Analyze the points of contention regarding the use of CRISPR-Cas9 for human germline editing.",
      "What are the main arguments for and against the 'simulation hypothesis' in physics and philosophy?",
    ];

    return (
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <span className="text-sm text-content-200 mr-2 mt-1.5">Try an example:</span>
        {suggestions.map((suggestion, index) => (
          <button key={index} onClick={() => onSuggestionClick(suggestion)} disabled={disabled} className="px-3 py-1.5 text-sm bg-base-200 border border-base-300 rounded-full hover:bg-base-300 hover:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{suggestion}</button>
        ))}
      </div>
    );
};
export default QuerySuggestions;
