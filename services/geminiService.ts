import { GoogleGenAI, Type } from "@google/genai";
import type { Paper, FiltersState } from '../types';

const paperSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, authors: { type: Type.ARRAY, items: { type: Type.STRING } }, year: { type: Type.INTEGER }, abstract: { type: Type.STRING }, doi: { type: Type.STRING }, primaryInstitution: { type: Type.STRING } }, required: ['title', 'authors', 'year', 'abstract', 'doi'] };
const analysisSchema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING, description: "A high-level summary of the academic discourse, disagreement, and consensus on the topic." }, disagreementScore: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER, description: "A numerical score from 1 (total consensus) to 10 (total disagreement)." }, qualitative: { type: Type.STRING, description: "A qualitative label for the score (e.g., 'Low Disagreement', 'High Contention')." }, }, required: ['score', 'qualitative'] }, keyPapers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { paper: paperSchema, rationale: { type: Type.STRING, description: "Explanation for why this paper is considered key to the debate." } }, required: ['paper', 'rationale'] }, description: "A comprehensive list of all influential or representative papers central to the debate. Do not impose an arbitrary limit; include all papers that are genuinely key." }, contentionPoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { topic: { type: Type.STRING, description: "The specific topic or sub-question where there is disagreement." }, stances: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING, description: "A unique identifier for this stance, combining paper DOI and a short hash of the quote." }, summary: { type: Type.STRING, description: "A summary of this specific viewpoint or finding." }, quote: { type: Type.STRING, description: "A direct, concise quote from the paper supporting this stance." }, paper: paperSchema }, required: ['id', 'summary', 'quote', 'paper'] }, description: "A comprehensive list of all distinct viewpoints or findings on this topic found in the provided papers." }, relatedPapers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { doi: { type: Type.STRING }, relevance: { type: Type.NUMBER, description: "Relevance of this paper to this specific contention point, from 1 (low) to 5 (high)." } }, required: ['doi', 'relevance'] }, description: "A list of ALL papers from the corpus that relate to this contention point, with a relevance score." } }, required: ['topic', 'stances', 'relatedPapers'] }, description: "A list of at least 3-5 major points of contention found in the literature." }, researchGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of at least 3 identified gaps in the current research or unanswered questions that logically follow from the points of contention." }, papers: { type: Type.ARRAY, items: paperSchema, description: "A list of all papers that were analyzed to generate this synthesis. This list MUST include every paper provided in the input." } }, required: ['summary', 'disagreementScore', 'keyPapers', 'contentionPoints', 'researchGaps', 'papers'] };
const standardizeQuerySchema = { type: Type.OBJECT, properties: { refinedQuery: { type: Type.STRING, description: "A concise, keyword-based search query for academic databases, using boolean operators and quotes." } }, required: ['refinedQuery'] };
const broadenQuerySchema = { type: Type.OBJECT, properties: { broadenedQuery: { type: Type.STRING, description: "A broader, simplified version of the input query, designed to increase the likelihood of returning search results from academic databases. This may involve removing restrictive keywords, using more general terms, or simplifying boolean logic." } }, required: ['broadenedQuery'] };
const relevanceAssessmentSchema = { type: Type.OBJECT, properties: { assessments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { doi: { type: Type.STRING }, isRelevant: { type: Type.BOOLEAN }, score: { type: Type.NUMBER }, relevanceJustification: { type: Type.STRING, description: "A brief justification for the relevance score, explaining why the paper is or isn't relevant to the query." } }, required: ['doi', 'isRelevant', 'score', 'relevanceJustification'] } } }, required: ['assessments'] };
const followUpSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING, description: "A clear, concise answer to the user's follow-up question, synthesized from the provided papers." }, sources: { type: Type.ARRAY, items: paperSchema, description: "A list of the specific papers used to formulate the answer." } }, required: ['question', 'answer', 'sources'] };

// FIX: Added a type for the API response to avoid spreading an 'any' type.
type RelevanceAssessment = {
    doi: string;
    isRelevant: boolean;
    score: number;
    relevanceJustification: string;
};

export const assessRelevance = async (papers: Paper[], query: string, apiKey: string) => { if (!apiKey) throw new Error("Gemini API key is not set."); const ai = new GoogleGenAI({ apiKey }); const systemInstruction = `You are a meticulous research assistant. Your task is to evaluate a list of academic papers based on a user's research query and determine their direct relevance. For each paper, assess if its abstract directly addresses the user's query. Return a relevance score from 1 (not relevant) to 5 (highly relevant) and a brief justification for the score in the 'relevanceJustification' field. Papers with a score below 3 should be marked as not relevant. Your entire output must be a single JSON object conforming to the provided schema, containing an assessment for every paper provided.`; const papersContext = papers.map(p => `DOI: ${p.doi}\nAbstract: ${p.abstract}`).join('\n\n---\n\n'); try { const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `User Query: "${query}"\n\nPaper Corpus:\n${papersContext}`, config: { systemInstruction, responseMimeType: "application/json", responseSchema: relevanceAssessmentSchema, temperature: 0.1 } }); const jsonText = response.text.trim(); const result: { assessments: RelevanceAssessment[] } = JSON.parse(jsonText); const assessments = new Map(result.assessments.map((item) => [item.doi, item])); return papers.map(paper => { const assessment = assessments.get(paper.doi) || { isRelevant: false, score: 1, relevanceJustification: 'AI assessment was not provided for this paper.' }; return { ...paper, ...assessment }; }); } catch (e) { console.error("Error assessing paper relevance. Proceeding with all papers marked as 'relevant' as a fallback.", e); return papers.map(p => ({...p, isRelevant: true, score: 3, relevanceJustification: 'Automatic relevance assessment failed. Included by default.'})); } };
export const standardizeQuery = async (query: string, apiKey: string) => { if (!apiKey) throw new Error("Gemini API key is not set."); const ai = new GoogleGenAI({ apiKey }); const systemInstruction = `You are an expert academic search strategist. Your task is to convert a user's natural language research question into a robust, keyword-based search query suitable for academic databases, and return it within a JSON object.

Follow these steps to construct the query:
1.  **Identify Core Concepts:** Break down the user's question into its essential conceptual parts.
2.  **Expand with Synonyms:** For each core concept, generate 2-3 relevant synonyms or closely related terms.
3.  **Combine with Operators:**
    *   Group synonyms for a single concept together using the OR operator and parentheses. For example: ("hebrew bible" OR "tanakh" OR "old testament").
    *   Connect the different concept groups with the AND operator.
    *   Use quotation marks "" for exact phrases of two or more words.
4.  **Ensure Correctness:** The final query must be syntactically correct, with balanced parentheses and quotes, and no trailing operators.

**Example Transformation:**
*   **User Question:** "hellenistic influence on hebrew bible"
*   **Core Concept 1:** Hellenistic influence. Synonyms: hellenism.
*   **Core Concept 2:** Hebrew Bible. Synonyms: tanakh, old testament.
*   **Resulting Query:** ("hellenistic influence" OR "hellenism") AND ("hebrew bible" OR "tanakh" OR "old testament")

Your entire output must be a single JSON object that strictly adheres to the provided schema, containing the final query.`; try { const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `User question: "${query}"`, config: { systemInstruction, responseMimeType: "application/json", responseSchema: standardizeQuerySchema, temperature: 0.1 } }); const jsonText = response.text.trim(); const result = JSON.parse(jsonText); const cleanedQuery = result.refinedQuery.trim().replace(/\s+(AND|OR|NOT)\s*$/i, '').trim(); return cleanedQuery; } catch (e) { console.error("Error standardizing query, falling back to original:", e); return query; } };
export const broadenQuery = async (failedQuery: string, apiKey: string) => { if (!apiKey) throw new Error("Gemini API key is not set."); const ai = new GoogleGenAI({ apiKey }); const systemInstruction = `You are an expert academic search strategist. A user's search query failed to return any results. Your task is to broaden the query to increase the chances of finding relevant papers. Simplify the query by removing very specific terms, replacing jargon with more common keywords, or reducing the number of AND operators. The goal is a query that is more general but still on-topic. The output must be a single JSON object with a single key "broadenedQuery".`; try { const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `The following academic search query returned zero results: "${failedQuery}". Please provide a broader version of this query.`, config: { systemInstruction, responseMimeType: "application/json", responseSchema: broadenQuerySchema, temperature: 0.5 } }); const jsonText = response.text.trim(); const result = JSON.parse(jsonText); const cleanedQuery = result.broadenedQuery.trim().replace(/\s+(AND|OR|NOT)\s*$/i, '').trim(); return cleanedQuery; } catch (e) { console.error("Error broadening query, falling back to original:", e); return failedQuery.replace(/"/g, ''); } };
export const fetchFromOpenAlex = async (query: string, filters: FiltersState): Promise<Paper[]> => {
    const buildFilterString = () => {
      let filterParts = [
        `publication_year:${filters.startYear}-${filters.endYear}`,
        'has_abstract:true'
      ];
      if (filters.isOpenAccess) {
        filterParts.push('is_oa:true');
      }
      if (filters.minCitations > 0) {
        filterParts.push(`cited_by_count:>${filters.minCitations}`);
      }
      return filterParts.join(',');
    };
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=${buildFilterString()}&per_page=50&sort=relevance_score:desc&select=title,authorships,publication_year,abstract_inverted_index,doi,primary_location`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return (data.results || []).map((item: any) => ({ title: item.title, authors: (item.authorships || []).map((a: any) => a.author.display_name), year: item.publication_year, abstract: item.abstract_inverted_index ? Object.entries(item.abstract_inverted_index).sort((a: any, b: any) => a[1][0] - b[1][0]).map(entry => entry[0]).join(' ') : '', doi: item.doi ? item.doi.replace('https://doi.org/', '') : '', primaryInstitution: item.authorships?.[0]?.institutions?.[0]?.display_name, })).filter((p: Paper) => p.doi && p.abstract);
    } catch (e) {
      console.error("Error fetching from OpenAlex:", e);
      return [];
    }
};
export const fetchFromSemanticScholar = async (query: string, filters: FiltersState): Promise<Paper[]> => { 
    let semanticScholarAPIUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&year=${filters.startYear}-${filters.endYear}&limit=50&fields=title,authors,year,abstract,externalIds,authors.affiliations`;
    if (filters.minCitations > 0) {
        semanticScholarAPIUrl += `&min_citation_count=${filters.minCitations}`;
    }
    if (filters.isOpenAccess) {
        semanticScholarAPIUrl += `&openAccessPdf=true`;
    }
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(semanticScholarAPIUrl)}`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`Could not fetch from Semantic Scholar (status: ${response.status}). The source will be skipped.`, errorText);
            return [];
        }
        const responseText = await response.text();
        if (responseText.toLowerCase().includes("too many requests")) {
            console.warn("Semantic Scholar source is rate-limited. Skipping this source.");
            return [];
        }
        const data = JSON.parse(responseText);
        return (data.data || []).map((item: any) => ({ title: item.title, authors: (item.authors || []).map((a: any) => a.name), year: item.year, abstract: item.abstract || '', doi: item.externalIds?.DOI || '', primaryInstitution: item.authors?.[0]?.affiliations?.[0], })).filter((p: Paper) => p.doi && p.abstract);
    } catch (e) {
        console.warn("Could not fetch or parse data from Semantic Scholar. This might be due to a proxy error or rate-limiting. The source will be skipped.", e);
        return [];
    }
};
export const fetchAllPapers = async (query: string, filters: FiltersState) => {
    const promises = [];
    if (filters.sources?.openAlex) {
      promises.push(fetchFromOpenAlex(query, filters));
    } else {
      promises.push(Promise.resolve([]));
    }

    if (filters.sources?.semanticScholar) {
      promises.push(fetchFromSemanticScholar(query, filters));
    } else {
      promises.push(Promise.resolve([]));
    }
    const [openAlexPapers, semanticScholarPapers] = await Promise.all(promises);
    const openAlexCount = openAlexPapers.length;
    const semanticScholarCount = semanticScholarPapers.length;
    const allPapers = [...openAlexPapers, ...semanticScholarPapers];
    const uniquePapers = Array.from(new Map(allPapers.map(p => [p.doi, p])).values());
    return { papers: uniquePapers.slice(0, 100), openAlexCount, semanticScholarCount };
};
export const generateSynthesis = async (papers: Paper[], query: string, apiKey: string, setStandardizedQuery: (query: string) => void) => {
  if (!apiKey) throw new Error("Gemini API key is not set.");
  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = `You are a world-class research analyst specializing in meta-analysis of academic literature. Your task is to analyze a corpus of provided paper abstracts based on a user's research question. Synthesize the information from ONLY the provided abstracts to produce a structured analysis. Focus on identifying the primary points of contention, key papers, and different stances taken by researchers. For each point of contention, you MUST evaluate every single paper from the provided corpus and include a list in 'relatedPapers' of all relevant papers, each with its DOI and a relevance score from 1 (tangential) to 5 (highly relevant). Do NOT use external knowledge. Your entire analysis must be grounded in the text of the abstracts provided. The final output must be a JSON object that strictly adheres to the provided schema. Do not output anything other than the JSON object. CRITICAL: Pay very close attention to JSON formatting. Ensure that all string values are valid JSON strings. Specifically, any double quotes (") that appear inside a string value, such as in a direct quote from a paper, MUST be properly escaped with a backslash (e.g., "some text with \\"a quote\\" inside"). Failure to do so will result in an invalid JSON object.`;
  
  try {
       if (papers.length === 0) {
          return {
              summary: "Analysis could not be completed because no papers were selected for the final synthesis.",
              disagreementScore: { score: 0, qualitative: "N/A" },
              keyPapers: [],
              contentionPoints: [],
              researchGaps: [`No papers were provided to perform an analysis.`],
              papers: [],
              synthesisTime: 0,
          };
      }

      setStandardizedQuery(`Analyzing ${papers.length} selected papers for synthesis...`);
      const papersContext = papers.map(p => `Title: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}\nDOI: ${p.doi}`).join('\n\n---\n\n');
      const startTime = performance.now();
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Research Query: "${query}"\n\nPaper Abstracts Corpus:\n${papersContext}`,
          config: { systemInstruction, responseMimeType: "application/json", responseSchema: analysisSchema, temperature: 0.2 }
      });
      const endTime = performance.now();
      const synthesisTime = (endTime - startTime) / 1000;
      
      let rawText = response.text.trim();
      let jsonText = rawText;

      if (jsonText.startsWith('```json') && jsonText.endsWith('```')) {
          jsonText = jsonText.substring('```json'.length, jsonText.length - '```'.length).trim();
      } else if (jsonText.startsWith('```') && jsonText.endsWith('```')) {
          jsonText = jsonText.substring('```'.length, jsonText.length - '```'.length).trim();
      }

      if (!jsonText) {
          throw new Error("The AI model returned a response that did not contain a valid JSON object.");
      }

      let resultFromModel;
      try {
          resultFromModel = JSON.parse(jsonText);
      } catch (parseError: any) {
          console.error("Failed to parse JSON response from Gemini:", jsonText);
          const errorPosition = parseError.message.match(/position (\d+)/);
          if (errorPosition) {
              const pos = parseInt(errorPosition[1], 10);
              const context = jsonText.substring(Math.max(0, pos - 50), Math.min(jsonText.length, pos + 50));
              console.error(`Context around error position ${pos}: ...${context}...`);
          }
          throw new Error("The AI model returned a malformed analysis that could not be read. This is often a temporary issue. Please try your analysis again.");
      }
      
      resultFromModel.papers = papers;
      return { ...resultFromModel, synthesisTime };
  } catch(e) {
      console.error("Error in generateSynthesis:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes('API key not valid')) {
          throw new Error('Your Gemini API key is not valid. Please check it and try again.');
      }
      if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('unavailable')) {
          throw new Error('The analysis service is temporarily unavailable. Please try again.');
      }
      throw new Error(`Failed to get analysis from Gemini API: ${errorMessage}`);
  }
};
export const askFollowUp = async (question: string, originalQuery: string, papers: Paper[], apiKey: string) => { if (!apiKey) throw new Error("Gemini API key is not set."); const ai = new GoogleGenAI({ apiKey }); const systemInstruction = `You are a research assistant continuing a conversation about an academic topic. The user has already received an initial analysis and is now asking a follow-up question. Your task is to answer this question based *only* on the provided list of academic papers. Do not introduce outside information. If the papers do not contain the answer, state that clearly. The final output must be a JSON object that strictly adheres to the provided schema.`; const papersContext = papers.map(p => `Title: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}\nDOI: ${p.doi}`).join('\n\n---\n\n'); try { const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Original Query: "${originalQuery}"\n\nFollow-up Question: "${question}"\n\nAvailable Papers:\n${papersContext}`, config: { systemInstruction, responseMimeType: "application/json", responseSchema: followUpSchema } }); const jsonText = response.text.trim(); const result = JSON.parse(jsonText); return { ...result, question }; } catch (e) { console.error("Error in askFollowUp:", e); const errorMessage = e instanceof Error ? e.message : String(e); if (errorMessage.includes('API key not valid')) { throw new Error('Your Gemini API key is not valid. Please check it and try again.'); } if (errorMessage.includes('503') || errorMessage.toLowerCase().includes('unavailable')) { throw new Error('The analysis service is temporarily unavailable. This is usually a temporary issue on Google\'s side. Please wait a few moments and try your follow-up question again.'); } throw new Error("Failed to get follow-up answer from Gemini API. The server responded with an error. Please try again later."); } };