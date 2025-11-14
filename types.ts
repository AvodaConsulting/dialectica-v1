export interface Institution {
  id: string;
  name: string;
}

export interface Paper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  doi: string;
  primaryInstitution?: string;
  score?: number; 
  relevanceJustification?: string;
  isRelevant?: boolean;
}

export interface KeyPaper {
    paper: Paper;
    rationale: string;
}

export interface Stance {
    id: string;
    summary: string;
    quote: string;
    paper: Paper;
}

export interface ContentionPoint {
    topic: string;
    stances: Stance[];
    relatedPapers: {
        doi: string;
        relevance: number;
    }[];
}

export interface AnalysisResult {
    summary: string;
    disagreementScore: {
        score: number;
        qualitative: string;
    };
    keyPapers: KeyPaper[];
    contentionPoints: ContentionPoint[];
    researchGaps: string[];
    papers: Paper[];
    synthesisTime?: number;
    finalQuery?: string;
    lowRelevancePapers?: Paper[];
    openAlexCount?: number;
    semanticScholarCount?: number;
}

export interface SavedItem {
    id: string;
    query: string;
    stance: Stance;
    savedAt: string;
}

export interface FiltersState {
    startYear: number | '';
    endYear: number | '';
    isOpenAccess: boolean;
    minCitations: number;
    sources: {
        openAlex: boolean;
        semanticScholar: boolean;
    }
}

export interface FollowUp {
    question: string;
    answer: string;
    sources: Paper[];
}

export interface UsageStats {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
}
