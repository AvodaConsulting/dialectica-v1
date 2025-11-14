import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import type { AnalysisResult, Institution, SavedItem, Stance, FollowUp } from '../types';
import DisagreementMeter from './DisagreementMeter';
import KeyPapers from './KeyPapers';
import FollowUpInput from './FollowUpInput';
import ReferencePaperCard from './ReferencePaperCard';
import BrainIcon from './icons/BrainIcon';
import ScaleIcon from './icons/ScaleIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import CitationIcon from './icons/CitationIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import LoaderIcon from './icons/LoaderIcon';
import LibKeyLink from './LibKeyLink';
import CitationModal from './CitationModal';

// Icons without dedicated files are defined here for use within this component and its children.
const DiagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
);
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);
const ChainIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);


const FeaturesIntro = () => {
    const features = [
        { icon: <ScaleIcon className="w-8 h-8 mb-3 text-brand-primary" />, title: "Uncover Contention", description: "Go beyond simple summaries. Dialectica identifies and maps the specific points of disagreement in academic literature." },
        { icon: <DiagramIcon className="w-8 h-8 mb-3 text-brand-primary" />, title: "Visualize the Debate", description: "The interactive knowledge graph connects key papers, contention points, and research gaps, revealing the structure of the academic conversation." },
        { icon: <LightbulbIcon className="w-8 h-8 mb-3 text-brand-primary" />, title: "Identify Research Gaps", description: "By analyzing disagreements, the app pinpoints unanswered questions and highlights opportunities for new research contributions." }
    ];
    
    return (
        <div className="mt-16 border-t border-base-300 pt-10 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {features.map(feature => (
                    <div key={feature.title} className="bg-base-200/50 p-6 rounded-lg">
                        {feature.icon}
                        <h3 className="text-lg font-bold text-content-100 mb-2">{feature.title}</h3>
                        <p className="text-content-200 text-sm">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const KnowledgeGraphDiagram: React.FC<{ papers: AnalysisResult['papers'], contentionPoints: AnalysisResult['contentionPoints'], researchGaps: AnalysisResult['researchGaps'] }> = ({ papers, contentionPoints, researchGaps }) => {
    // ... KnowledgeGraphDiagram component implementation ...
    const [graphLayout, setGraphLayout] = useState({ nodes: [], lines: [], width: 0, height: 0 });
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [showAllPapers, setShowAllPapers] = useState(false);
    const NODE_WIDTH = { paper: 220, contention: 240, gap: 220 };
    const NODE_HEIGHT = { paper: 60, contention: 90, gap: 90 };

    const connections = useMemo(() => {
        const conn: any = { papers: {}, contentions: {}, gaps: {} };
        if (!papers || !contentionPoints || !researchGaps) return conn;

        papers.forEach(p => { conn.papers[p.doi] = { contentions: [] }; });
        
        contentionPoints.forEach((point, pointIndex) => {
            const relatedPaperDois = point.relatedPapers?.map(p => p.doi) || [];
            const relatedGapIndices = researchGaps
                .map((gap, gapIndex) => ({ gap, gapIndex }))
                .filter(({ gap }) => point.topic.split(' ').some(word => gap.toLowerCase().includes(word.toLowerCase())))
                .map(({ gapIndex }) => gapIndex);
            
             if (relatedGapIndices.length === 0 && researchGaps.length > 0) {
                const fallbackIndex = pointIndex % researchGaps.length;
                relatedGapIndices.push(fallbackIndex);
             }

            relatedGapIndices.forEach(gapIndex => { conn.gaps[gapIndex] = { ...conn.gaps[gapIndex], contention: pointIndex }; });
            conn.contentions[pointIndex] = { papers: relatedPaperDois, gaps: relatedGapIndices };
            relatedPaperDois.forEach(doi => { if (conn.papers[doi]) conn.papers[doi].contentions.push(pointIndex); });
        });

        return conn;
    }, [papers, contentionPoints, researchGaps]);
    
    const contentionPaperDois = useMemo(() => {
        if (!contentionPoints) return new Set();
        return new Set(contentionPoints.flatMap(p => p.relatedPapers?.map(rp => rp.doi) || []));
    }, [contentionPoints]);

    const displayedPapers = useMemo(() => {
        if (!papers) return [];
        if (showAllPapers || contentionPaperDois.size === 0) return papers;
        return papers.filter(p => contentionPaperDois.has(p.doi));
    }, [showAllPapers, papers, contentionPaperDois]);

    useLayoutEffect(() => {
        if (!contentionPoints || contentionPoints.length === 0 || !displayedPapers || displayedPapers.length === 0) {
            setGraphLayout({ nodes: [], lines: [], width: 0, height: 0 });
            return;
        }
        
        const PADDING = 40;
        const COLUMN_GAP = 250;
        const VERTICAL_GAP = 25;
        
        const nodeMap = new Map();

        let currentPaperY = PADDING;
        const paperNodes = displayedPapers.map(p => {
            const node = { id: `paper-${p.doi}`, type: 'paper', data: p, x: PADDING, y: currentPaperY, width: NODE_WIDTH.paper, height: NODE_HEIGHT.paper };
            currentPaperY += node.height + VERTICAL_GAP;
            nodeMap.set(node.id, node);
            return node;
        });

        const contentionNodesWithBarycenter = contentionPoints.map((point, index) => {
            const relatedDois = connections.contentions[index]?.papers || [];
            const connectedPaperNodes = paperNodes.filter(pNode => relatedDois.includes(pNode.data.doi));
            let barycenter = -1;
            if (connectedPaperNodes.length > 0) {
                barycenter = connectedPaperNodes.reduce((sum, pNode) => sum + pNode.y + pNode.height / 2, 0) / connectedPaperNodes.length;
            }
            return { id: `contention-${index}`, type: 'contention', data: point, width: NODE_WIDTH.contention, height: NODE_HEIGHT.contention, barycenter, index };
        });

        contentionNodesWithBarycenter.sort((a, b) => a.barycenter - b.barycenter);
        
        const contentionX = PADDING + NODE_WIDTH.paper + COLUMN_GAP;
        let currentContentionY = PADDING;
        const contentionNodes = contentionNodesWithBarycenter.map(c => {
            const node = { ...c, x: contentionX, y: currentContentionY };
            currentContentionY += node.height + VERTICAL_GAP * 2;
            nodeMap.set(node.id, node);
            return node;
        });

        const gapNodesWithBarycenter = researchGaps.map((gap, index) => {
            const relatedContentionIndex = connections.gaps[index]?.contention;
            let barycenter = -1;
            if (relatedContentionIndex !== undefined) {
                const connectedContentionNode = contentionNodes.find(cNode => cNode.index === relatedContentionIndex);
                if (connectedContentionNode) {
                    barycenter = connectedContentionNode.y + connectedContentionNode.height / 2;
                }
            }
            return { id: `gap-${index}`, type: 'gap', data: { gapText: gap, index }, width: NODE_WIDTH.gap, height: NODE_HEIGHT.gap, barycenter };
        });
        
        gapNodesWithBarycenter.sort((a, b) => a.barycenter - b.barycenter);

        const gapX = contentionX + NODE_WIDTH.contention + COLUMN_GAP;
        let currentGapY = PADDING;
        const gapNodes = gapNodesWithBarycenter.map(g => {
            const node = { ...g, x: gapX, y: currentGapY };
            currentGapY += node.height + VERTICAL_GAP;
            nodeMap.set(node.id, node);
            return node;
        });

        const lines: any[] = [];
        contentionNodes.forEach(sourceNode => {
            const conns = connections.contentions[sourceNode.index];
            if (!conns) return;

            conns.papers.forEach((doi: string) => {
                const targetNode = nodeMap.get(`paper-${doi}`);
                if (targetNode) {
                    lines.push({ key: `line-p-${doi}-${sourceNode.index}`, source: targetNode, target: sourceNode, type: 'paper-contention' });
                }
            });
            conns.gaps.forEach((gapIndex: number) => {
                const targetNode = nodeMap.get(`gap-${gapIndex}`);
                if (targetNode) {
                    lines.push({ key: `line-g-${sourceNode.index}-${gapIndex}`, source: sourceNode, target: targetNode, type: 'contention-gap' });
                }
            });
        });
        
        const allNodes = [...paperNodes, ...contentionNodes, ...gapNodes];
        const totalHeight = Math.max(currentPaperY, currentContentionY, currentGapY) + PADDING;
        const totalWidth = gapX + NODE_WIDTH.gap + PADDING;

        setGraphLayout({ nodes: allNodes, lines, width: totalWidth, height: totalHeight });

    }, [connections, displayedPapers, contentionPoints, researchGaps]);

    const getPathData = (sourceNode: any, targetNode: any) => {
        const x1 = sourceNode.x + sourceNode.width;
        const y1 = sourceNode.y + sourceNode.height / 2;
        const x2 = targetNode.x;
        const y2 = targetNode.y + targetNode.height / 2;
        const controlPointOffset = Math.max(40, (x2 - x1) * 0.4);
        return `M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1} ${x2 - controlPointOffset} ${y2} ${x2} ${y2}`;
    };

    const activeNodeIds = useMemo(() => {
        if (!selectedNode) return null; // null means all are active
        const ids = new Set([selectedNode.id]);
        graphLayout.lines.forEach((line: any) => {
            if (line.source.id === selectedNode.id) {
                ids.add(line.target.id);
            } else if (line.target.id === selectedNode.id) {
                ids.add(line.source.id);
            }
        });
        return ids;
    }, [selectedNode, graphLayout.lines]);

    const isNodeActive = (node: any) => {
        if (!activeNodeIds) return true;
        return activeNodeIds.has(node.id);
    };

    const isLineActive = (line: any) => {
        if (!selectedNode) return true;
        return line.source.id === selectedNode.id || line.target.id === selectedNode.id;
    };

    const handleNodeClick = (e: React.MouseEvent, node: any) => {
        e.stopPropagation();
        setSelectedNode((prev: any) => (prev && prev.id === node.id) ? null : node);
    };

    const NodeContent = ({ node }: { node: any }) => {
      const isSelected = selectedNode?.id === node.id;
      const isActive = isNodeActive(node);
       
      return (
        <div onClick={(e) => handleNodeClick(e, node)}
             className={`h-full w-full bg-base-100/95 dark:bg-base-100/90 p-2 rounded-lg shadow-sm cursor-pointer transition-all duration-300 flex items-center justify-center text-center text-xs backdrop-blur-sm
                        ${isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}
                        ${isSelected ? 'ring-2 ring-brand-primary' : 'border border-base-300'}`}>
          {node.type === 'paper' && <p className="font-semibold" title={node.data.title}>{node.data.title}</p>}
          {node.type === 'contention' && <p>{node.data.topic}</p>}
          {node.type === 'gap' && <p>{node.data.gapText || node.data}</p>}
        </div>
      );
    };

    if (!graphLayout.nodes || graphLayout.nodes.length === 0) return null;
    
    return (
      <section>
        <h2 className="text-2xl font-bold text-content-100 mb-4 flex items-center gap-3">
            <DiagramIcon className="w-7 h-7" /> Knowledge Graph
        </h2>
        <div className="bg-base-200 p-2 sm:p-4 rounded-lg border border-base-300 relative overflow-x-auto" onClick={() => setSelectedNode(null)}>
            <div className="flex justify-around mb-2 text-center font-semibold text-lg text-content-100">
              <h3 style={{width: NODE_WIDTH.paper}}>Analyzed Papers</h3>
              <h3 style={{width: NODE_WIDTH.contention}}>Points of Contention</h3>
              <h3 style={{width: NODE_WIDTH.gap}}>Resulting Gaps</h3>
            </div>
            <svg width={graphLayout.width} height={graphLayout.height} aria-hidden="true" className="font-sans">
                <defs>
                  <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="5" refY="1.75" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L5,1.75 L0,3.5 z" className="fill-current text-brand-secondary" />
                  </marker>
                </defs>
                <g>
                  {graphLayout.lines.map((line: any) => {
                    const isActive = isLineActive(line);
                    return <path key={line.key} d={getPathData(line.source, line.target)} strokeWidth={isActive ? 2.5 : 1.5} fill="none"
                                 className={`transition-all duration-300 ${line.type === 'contention-gap' ? 'stroke-brand-secondary' : 'stroke-slate-400 dark:stroke-slate-500'} ${isActive ? 'opacity-80' : 'opacity-10'}`}
                                 markerEnd={line.type === 'contention-gap' && isActive ? "url(#arrowhead)" : "none"} />;
                  })}
                </g>
                <g>
                  {graphLayout.nodes.map((node: any) => (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                      <foreignObject width={node.width} height={node.height}>
                        <NodeContent node={node} />
                      </foreignObject>
                    </g>
                  ))}
                </g>
            </svg>
            {papers && papers.length > displayedPapers.length && (
                <div className="text-center mt-2 relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowAllPapers(true); }} className="text-sm text-brand-primary hover:underline">
                        Show all {papers.length} papers...
                    </button>
                </div>
            )}
            <p className="text-xs text-content-200 mt-4 text-center relative">
                Click any element to explore connections. Click background to clear selection.
            </p>
        </div>
      </section>
    );
};

interface ResultsDisplayProps {
    result: AnalysisResult | null;
    onSaveStance: (stance: Stance) => void;
    savedStanceIds: string[];
    institution: Institution | null;
    onFollowUp: (question: string) => void;
    followUpHistory: FollowUp[];
    isFollowUpLoading: boolean;
    standardizedQuery: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onSaveStance, savedStanceIds, institution, onFollowUp, followUpHistory, isFollowUpLoading, standardizedQuery }) => {
    // ... ResultsDisplay component implementation ...
    const StanceCard: React.FC<{ stance: Stance, onSave: () => void, isSaved: boolean, institution: Institution | null }> = ({ stance, onSave, isSaved, institution }) => {
        const [isCiting, setIsCiting] = useState(false);

        return (
            <div className="bg-base-200 p-4 rounded-lg border border-base-300">
                <p className="font-semibold text-content-100 mb-2">{stance.summary}</p>
                <blockquote className="border-l-2 border-brand-primary/50 pl-3 text-sm text-content-200 italic my-2">"{stance.quote}"</blockquote>
                <div className="flex justify-between items-end mt-3 text-xs">
                    <div className="flex-1 min-w-0">
                        <a href={`https://doi.org/${stance.paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-content-200 hover:text-brand-primary font-semibold block truncate">{stance.paper.authors[0]} et al. ({stance.paper.year})</a>
                        {stance.paper.primaryInstitution && (<p className="text-content-200 truncate" title={stance.paper.primaryInstitution}>{stance.paper.primaryInstitution}</p>)}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {institution && <LibKeyLink doi={stance.paper.doi} institution={institution} variant="icon" />}
                        <button onClick={() => setIsCiting(true)} className="p-1 rounded-full text-content-200 hover:text-brand-primary" title="Cite this source"><CitationIcon className="w-5 h-5" /></button>
                        <button onClick={onSave} className={`p-1 rounded-full ${isSaved ? 'text-brand-secondary' : 'text-content-200 hover:text-brand-secondary'}`} title={isSaved ? "Saved" : "Save this stance"}>
                            {isSaved ? <CheckCircleIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                {isCiting && <CitationModal paper={stance.paper} onClose={() => setIsCiting(false)} />}
            </div>
        );
    };

    const INITIAL_KEY_PAPERS = 3;
    const INITIAL_CONTENTION_POINTS = 3;
    const LOAD_MORE_INCREMENT = 5;

    const [visibleKeyPapers, setVisibleKeyPapers] = useState(INITIAL_KEY_PAPERS);
    const [visibleContentionPoints, setVisibleContentionPoints] = useState(INITIAL_CONTENTION_POINTS);
    const [isFullListVisible, setIsFullListVisible] = useState(false);
    const [isExcludedListVisible, setIsExcludedListVisible] = useState(false);
    
    const sortedPapers = React.useMemo(() => {
        if (!result?.papers) return [];
        return [...result.papers].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            const authorA = a.authors?.[0] || '';
            const authorB = b.authors?.[0] || '';
            const lastNameA = authorA.split(' ').pop() || '';
            const lastNameB = authorB.split(' ').pop() || '';
            return lastNameA.localeCompare(lastNameB);
        });
    }, [result?.papers]);

    useEffect(() => {
        if (result) {
            setVisibleKeyPapers(INITIAL_KEY_PAPERS);
            setVisibleContentionPoints(INITIAL_CONTENTION_POINTS);
            setIsFullListVisible(false);
            setIsExcludedListVisible(false);
        }
    }, [result]);
    
    const handleExport = () => {
        if (!result) return;
        const jsonString = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dialectica-analysis.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!result) {
        return (
            <div className="text-center p-8 min-h-[400px] flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    <div className="max-w-md mx-auto">
                        <BrainIcon className="w-16 h-16 text-base-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-content-100">Welcome to Dialectica</h2>
                        <p className="text-content-200 text-lg mt-2">Your synthesis will appear here. Use the panel on the left to start a new analysis.</p>
                    </div>
                    <FeaturesIntro />
                </div>
            </div>
        );
    }

    const loadMoreButton = (onClick: () => void) => (
        <div className="mt-6 text-center">
            <button onClick={onClick} className="px-5 py-2 bg-base-200 border border-base-300 rounded-full font-semibold text-brand-primary hover:bg-base-300 transition-colors" aria-label="Load more items">Load More...</button>
        </div>
    );
    
    return (
        <div className="space-y-12 animate-fade-in">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-base-200 p-6 rounded-lg border border-base-300">
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-2xl font-bold text-content-100">Executive Summary</h2>
                      <button onClick={handleExport} className="p-2 rounded-full hover:bg-base-300 text-content-200" title="Export analysis results">
                          <DownloadIcon className="w-6 h-6"/>
                      </button>
                    </div>
                    <div className="text-xs text-content-200 mb-4 border-b border-base-300 pb-4">
                        Analyzed <strong>{result.papers.length}</strong> relevant papers
                        {result.lowRelevancePapers && result.lowRelevancePapers.length > 0 && <span> (<strong>{result.lowRelevancePapers.length}</strong> excluded)</span>}
                        &nbsp;from {result.openAlexCount ?? 0} OpenAlex & {result.semanticScholarCount ?? 0} Semantic Scholar results
                        and generated synthesis in <strong>{result.synthesisTime?.toFixed(1) ?? '?'}</strong> seconds.
                    </div>
                    <p className="text-content-100 whitespace-pre-wrap">{result.summary}</p>
                </div>
                <div className="bg-base-200 p-6 rounded-lg border border-base-300 flex flex-col items-center justify-center">
                  <DisagreementMeter score={result.disagreementScore.score} label={result.disagreementScore.qualitative} />
                </div>
            </section>
            
            <section className="text-center animate-fade-in-up">
                <p className="text-content-200 mb-3">Want to dig deeper or verify these findings?</p>
                <a 
                    href={`https://www.jstor.org/action/doBasicSearch?Query=${encodeURIComponent(standardizedQuery.split(' (')[0])}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-base-200 border border-base-300 rounded-full font-semibold text-content-100 hover:bg-base-300 hover:border-brand-primary transition-colors group"
                >
                    <ChainIcon className="w-5 h-5 text-content-200 group-hover:text-brand-primary transition-colors" />
                    <span>Search this query on JSTOR</span>
                    <ArrowRightIcon className="w-4 h-4 ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                </a>
            </section>
            
            <div>
                <KeyPapers papers={result.keyPapers.slice(0, visibleKeyPapers)} institution={institution} />
                {result.keyPapers.length > visibleKeyPapers && loadMoreButton(() => setVisibleKeyPapers(p => p + LOAD_MORE_INCREMENT))}
            </div>

            <KnowledgeGraphDiagram papers={result.papers} contentionPoints={result.contentionPoints} researchGaps={result.researchGaps} />

            <section>
                <h2 className="text-2xl font-bold text-content-100 mb-4 flex items-center gap-3"><ScaleIcon className="w-7 h-7" /> Detailed Points of Contention</h2>
                <div className="space-y-6">
                    {result.contentionPoints.slice(0, visibleContentionPoints).map((point, index) => (
                        <div key={index} className="p-6 bg-base-200 rounded-lg border border-base-300">
                            <h3 className="text-xl font-semibold mb-4 text-content-100">{point.topic}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {point.stances.map(stance => (<StanceCard key={stance.id} stance={stance} onSave={() => onSaveStance(stance)} isSaved={savedStanceIds.includes(stance.id)} institution={institution}/>))}
                            </div>
                        </div>
                    ))}
                </div>
                {result.contentionPoints.length > visibleContentionPoints && loadMoreButton(() => setVisibleContentionPoints(p => p + LOAD_MORE_INCREMENT))}
            </section>
            
            <section>
                <h2 className="text-2xl font-bold text-content-100 mb-4">Ask a Follow-Up</h2>
                <div className="bg-base-200 p-6 rounded-lg border border-base-300">
                    {followUpHistory.length > 0 && (
                        <div className="space-y-4 mb-6">
                            {followUpHistory.map((item, index) => (
                                <div key={index} className="p-4 bg-base-100 rounded-md">
                                    <p className="font-semibold text-content-100">Q: {item.question}</p>
                                    <p className="text-content-100 mt-2 whitespace-pre-wrap">A: {item.answer}</p>
                                    {item.sources.length > 0 && (<div className="mt-3 text-xs text-content-200"><strong>Sources: </strong>{item.sources.map(s => s.title).join('; ')}</div>)}
                                </div>
                            ))}
                        </div>
                    )}
                    {isFollowUpLoading && (<div className="flex items-center gap-2 text-content-200"><LoaderIcon className="w-5 h-5 animate-spin" /><span>Thinking...</span></div>)}
                    <FollowUpInput onFollowUp={onFollowUp} isLoading={isFollowUpLoading} />
                </div>
            </section>
            <section>
                <div className="border-t border-base-300 pt-8">
                    <button onClick={() => setIsFullListVisible(prev => !prev)} className="w-full flex justify-between items-center text-left text-2xl font-bold text-content-100" aria-expanded={isFullListVisible}>
                        <span>Full Corpus of Analyzed Papers ({result.papers.length})</span>
                        <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${isFullListVisible ? 'rotate-180' : ''}`} />
                    </button>
                    {isFullListVisible && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                            {sortedPapers.map(paper => (<ReferencePaperCard key={paper.doi} paper={paper} institution={institution}/>))}
                        </div>
                    )}
                </div>
            </section>
            {result.lowRelevancePapers && result.lowRelevancePapers.length > 0 && (
                <section>
                    <div className="border-t border-base-300 pt-8 mt-8">
                        <button onClick={() => setIsExcludedListVisible(prev => !prev)} className="w-full flex justify-between items-center text-left text-2xl font-bold text-content-100" aria-expanded={isExcludedListVisible}>
                            <span>Papers Excluded from Analysis ({result.lowRelevancePapers.length})</span>
                            <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${isExcludedListVisible ? 'rotate-180' : ''}`} />
                        </button>
                        <p className="text-content-200 mt-2">These papers were retrieved by the keyword search but were determined by the AI to be not directly relevant to the core research question.</p>
                        {isExcludedListVisible && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                                {result.lowRelevancePapers.map(paper => (
                                    <div key={paper.doi} className="bg-base-200/60 p-4 rounded-lg border border-base-300 flex flex-col opacity-90">
                                        <h3 className="font-bold text-content-100">{paper.title}</h3>
                                        <p className="text-sm text-content-200 mt-1">{paper.authors[0]} et al. ({paper.year})</p>
                                        <div className="flex-grow" />
                                        <div className="mt-3 p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md text-sm border border-amber-500/20">
                                            <p><strong className="font-semibold">Reason for exclusion:</strong> {paper.relevanceJustification}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary hover:underline">
                                                View on Publisher &rarr;
                                            </a>
                                            {institution && <LibKeyLink doi={paper.doi} institution={institution} variant="icon" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};
export default ResultsDisplay;
