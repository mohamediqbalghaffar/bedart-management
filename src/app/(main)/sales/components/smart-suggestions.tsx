"use client";

import React, { useState, useEffect } from "react";
import { getSmartSuggestions, SmartSuggestionOutput } from "@/ai/flows/smart-product-suggestions";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, X } from "lucide-react";

type SmartSuggestionsProps = {
  searchTerm: string;
  context?: string;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
};

export function SmartSuggestions({ searchTerm, context, onSelect, onClose }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestionOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm.length > 2) {
      setIsLoading(true);
      getSmartSuggestions({ searchTerm: debouncedSearchTerm, context })
        .then((result) => {
          setSuggestions(result);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm, context]);

  if (!searchTerm && !isLoading) return null;

  return (
    <Card className="absolute z-10 w-full mt-2 shadow-lg">
        <div className="flex justify-between items-center p-2 border-b">
            <div className="flex items-center gap-2 font-semibold text-sm">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Smart Suggestions
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        </div>
      <CardContent className="p-2 max-h-60 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="ml-2">Finding suggestions...</p>
          </div>
        )}
        {!isLoading && suggestions.length === 0 && debouncedSearchTerm.length > 2 && (
          <p className="text-center text-sm text-muted-foreground p-4">
            No suggestions found for this search.
          </p>
        )}
        <ul className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => onSelect(suggestion.suggestion)}
              className="p-2 rounded-md hover:bg-secondary cursor-pointer"
            >
              <p className="font-semibold">{suggestion.suggestion}</p>
              <p className="text-xs text-muted-foreground">
                {suggestion.reason} (Confidence: {Math.round(suggestion.confidence * 100)}%)
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
