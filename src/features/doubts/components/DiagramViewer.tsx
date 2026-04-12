'use client';

import { useState, useEffect, useRef } from 'react';
import { GitBranch, Loader2, AlertCircle, Sparkles, X } from 'lucide-react';

interface DiagramViewerProps {
  doubtTitle: string;
  doubtContent: string;
}

export function DiagramViewer({ doubtTitle, doubtContent }: DiagramViewerProps) {
  const [diagram, setDiagram] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderAttempted = useRef(false);

  const generateDiagram = async () => {
    setIsLoading(true);
    setError(null);
    renderAttempted.current = false;

    try {
      const res = await fetch('/api/ai/diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doubt: doubtContent, title: doubtTitle }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to generate diagram');
      }

      const { diagram: raw } = await res.json();
      setDiagram(raw);
      setIsVisible(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render mermaid whenever diagram changes
  useEffect(() => {
    if (!diagram || !containerRef.current || renderAttempted.current) return;
    renderAttempted.current = true;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#1a2744',
            primaryTextColor: '#dae2fd',
            primaryBorderColor: '#4fdbc8',
            lineColor: '#4fdbc8',
            secondaryColor: '#162038',
            tertiaryColor: '#0f1a30',
            background: '#0b1326',
            mainBkg: '#1a2744',
            nodeBorder: '#4fdbc8',
            clusterBkg: '#162038',
            titleColor: '#dae2fd',
            edgeLabelBackground: '#0b1326',
            fontFamily: 'Manrope, sans-serif',
          },
        });

        const id = `diagram-${Date.now()}`;
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const { svg } = await mermaid.render(id, diagram);
          containerRef.current.innerHTML = svg;
          // Ensure svg is responsive
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
          }
        }
      } catch (err: any) {
        setError('Could not render diagram. The AI may have generated invalid syntax.');
        console.error('Mermaid render error:', err);
      }
    };

    render();
  }, [diagram]);

  if (!isVisible && !isLoading && !error) {
    return (
      <button
        onClick={generateDiagram}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:scale-105"
        style={{
          background: 'rgba(221, 183, 255, 0.08)',
          border: '1px solid rgba(221, 183, 255, 0.2)',
          color: '#ddb7ff',
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Visualize with AI Diagram
      </button>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden mt-4"
      style={{
        background: 'rgba(11, 19, 38, 0.8)',
        border: '1px solid rgba(79, 219, 200, 0.12)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'rgba(79, 219, 200, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#ddb7ff]" />
          <span className="text-xs font-semibold text-[#dae2fd]">AI Concept Diagram</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
            style={{ background: 'rgba(221, 183, 255, 0.1)', color: '#ddb7ff' }}
          >
            Gemini
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateDiagram}
            disabled={isLoading}
            className="text-[10px] text-[#4fdbc8] hover:text-[#ddb7ff] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Regenerate'}
          </button>
          <button
            onClick={() => { setIsVisible(false); setDiagram(null); setError(null); }}
            className="text-[#8899b8] hover:text-[#dae2fd] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-[#4fdbc8] animate-spin" />
            <p className="text-xs text-[#8899b8]">Generating concept diagram with AI...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-start gap-2 py-4 px-3 rounded-lg"
            style={{ background: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.15)' }}>
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-400 font-medium">Diagram generation failed</p>
              <p className="text-[11px] text-[#8899b8] mt-1">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && diagram && (
          <div
            ref={containerRef}
            className="overflow-x-auto"
            style={{ minHeight: '120px' }}
          />
        )}
      </div>
    </div>
  );
}
