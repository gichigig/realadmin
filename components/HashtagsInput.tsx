"use client";

import { useState, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { rentalsApi } from "@/lib/api";

interface HashtagsInputProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
}

export default function HashtagsInput({ hashtags = [], onChange }: HashtagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [popularHashtags, setPopularHashtags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch popular hashtags on mount
    const fetchPopular = async () => {
      try {
        const data = await rentalsApi.getPopularHashtags();
        setPopularHashtags(data || []);
      } catch (err) {
        console.error("Failed to fetch popular hashtags", err);
      }
    };
    fetchPopular();
  }, []);

  useEffect(() => {
    // Filter suggestions based on input
    if (inputValue.trim().length > 0) {
      const filtered = popularHashtags
        .filter((tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !hashtags.includes(tag))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      // Show top 5 popular if empty input but focused
      setSuggestions(popularHashtags.filter(tag => !hashtags.includes(tag)).slice(0, 5));
    }
  }, [inputValue, popularHashtags, hashtags]);

  useEffect(() => {
    // Click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHashtag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && hashtags.length > 0) {
      removeHashtag(hashtags[hashtags.length - 1]);
    }
  };

  const addHashtag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, "").trim().toLowerCase();
    if (cleanTag && cleanTag.length > 1 && !hashtags.includes(cleanTag) && hashtags.length < 10) {
      onChange([...hashtags, cleanTag]);
      setInputValue("");
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    onChange(hashtags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Hashtags (Max 10)
      </label>
      <div
        className={`flex flex-wrap items-center gap-2 px-3 py-2 border rounded-lg bg-white transition-colors ${
          isFocused ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-300"
        }`}
      >
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeHashtag(tag)}
              className="p-0.5 hover:bg-blue-200 rounded-full transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          disabled={hashtags.length >= 10}
          placeholder={hashtags.length >= 10 ? "Maximum reached" : "Add hashtag (e.g., modern, affordable)"}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
        />
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                addHashtag(tag);
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Press Enter or comma to add a hashtag. Help tenants find your property easily.
      </p>
    </div>
  );
}
