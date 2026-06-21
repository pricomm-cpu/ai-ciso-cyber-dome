import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardCheck, ChevronDown, Info, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { AssessmentResponse } from "@shared/schema";

interface Question {
  id: number;
  category: string;
  level: string;
  question: string;
  weight: string;
  fix: string;
  why: string;
}

interface ScoreData {
  overallPct: number;
  totalAnswered: number;
  totalQuestions: number;
  categories: Record<string, { scored: number; max: number; count: number; answered: number }>;
}

const ANSWER_OPTIONS = ["Yes", "Partial", "No"] as const;
const ANSWER_STYLES: Record<string, string> = {
  Yes: "bg-green-500/20 text-green-400 border-green-500/40",
  Partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  No: "bg-red-500/20 text-red-400 border-red-500/40",
};
const WEIGHT_BADGE: Record<string, string> = {
  High: "badge-critical",
  Medium: "badge-medium",
  Low: "badge-low",
};

export default function Assessment() {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const { data: questions = [], isLoading: qLoading } = useQuery<Question[]>({
    queryKey: ["/api/assessment/questions"],
  });

  const { data: responses = [], isLoading: rLoading } = useQuery<AssessmentResponse[]>({
    queryKey: ["/api/assessment/responses"],
  });

  const { data: score } = useQuery<ScoreData>({
    queryKey: ["/api/assessment/score"],
  });

  const respondMut = useMutation({
    mutationFn: (data: { questionId: number; answer: string }) =>
      apiRequest("POST", "/api/assessment/respond", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/assessment/responses"] });
      qc.invalidateQueries({ queryKey: ["/api/assessment/score"] });
    },
  });

  const responseMap = new Map(responses.map(r => [r.questionId, r.answer]));

  const categories = Array.from(new Set(questions.map(q => q.category)));
  const displayCat = activeCategory || categories[0];

  const filteredQs = questions.filter(q => q.category === displayCat);
  const catScore = score?.categories[displayCat];

  const overallPct = score?.overallPct ?? 0;
  const scoreColor = overallPct >= 70 ? "text-green-400" : overallPct >= 40 ? "text-yellow-400" : "text-red-400";

  const isLoading = qLoading || rLoading;

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Security Posture Assessment</h1>
          <p className="text-sm text-muted-foreground mt-0.5 ai-pulse">100-question AI assessment · no consultant required</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${scoreColor}`}>{overallPct}%</div>
          <div className="text-xs text-muted-foreground">{score?.totalAnswered}/{score?.totalQuestions} answered</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${overallPct}%` }} />
      </div>

      {/* Category scores overview */}
      {score && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(score.categories).map(([cat, s]) => {
            const pct = s.max > 0 ? Math.round((s.scored / s.max) * 100) : 0;
            const shortCat = cat.split(" ").slice(0, 2).join(" ");
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`p-2.5 rounded-md border text-left transition-colors text-xs
                  ${activeCategory === cat || (!activeCategory && cat === categories[0])
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
                data-testid={`cat-${cat}`}
              >
                <div className="font-medium truncate">{shortCat}</div>
                <div className="mt-1 progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct >= 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444" }} />
                </div>
                <div className="mt-1">{pct}% · {s.answered}/{s.count}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{displayCat}</div>
          {catScore && (
            <div className="text-xs text-muted-foreground">{catScore.answered}/{catScore.count} answered</div>
          )}
        </div>

        {isLoading
          ? [1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)
          : filteredQs.map(q => {
              const current = responseMap.get(q.id) ?? null;
              const isExpanded = expandedQ === q.id;
              return (
                <Card key={q.id} className={`glow-card transition-all ${current === "No" ? "border-red-500/20" : current === "Yes" ? "border-green-500/20" : ""}`} data-testid={`question-${q.id}`}>
                  <CardContent className="p-0">
                    <button
                      className="w-full flex items-start gap-3 p-3.5 text-left"
                      onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                    >
                      <div className="w-7 h-5 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xs font-mono text-muted-foreground">{String(q.id).padStart(2,"0")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{q.question}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${WEIGHT_BADGE[q.weight] || "badge-low"}`}>{q.weight}</span>
                          <span className="text-xs text-muted-foreground">{q.level}</span>
                        </div>
                      </div>
                      {/* Answer buttons */}
                      <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {ANSWER_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            data-testid={`answer-${opt}-${q.id}`}
                            onClick={() => respondMut.mutate({ questionId: q.id, answer: opt })}
                            disabled={respondMut.isPending}
                            className={`text-xs px-2 py-1 rounded border transition-all ${
                              current === opt
                                ? ANSWER_STYLES[opt]
                                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-md bg-secondary p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Info size={12} className="text-cyan-400" />
                              <span className="text-xs font-semibold text-cyan-400">Why it matters</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{q.why}</p>
                          </div>
                          <div className="rounded-md bg-secondary p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Lightbulb size={12} className="text-yellow-400" />
                              <span className="text-xs font-semibold text-yellow-400">Quick fix</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{q.fix}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
        }
      </div>
    </div>
  );
}
