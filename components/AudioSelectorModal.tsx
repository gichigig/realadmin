"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Music, Volume2, Play, Pause, Check, Link as LinkIcon, Upload, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export interface AudioTrack {
  id: string;
  title: string;
  category: string;
  audioUrl: string;
  duration?: string;
  artist?: string;
}

interface AudioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: { url: string; title: string }) => void;
  currentAudioUrl?: string;
  currentAudioTitle?: string;
}

const DEFAULT_PRESETS: AudioTrack[] = [
  {
    id: "lofi_chill_1",
    title: "Cozy Home Lofi Beat",
    category: "Lofi & Chill",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    duration: "2:25",
    artist: "Royalty Free Music"
  },
  {
    id: "acoustic_warm_1",
    title: "Sunny Walkthrough Acoustic",
    category: "Acoustic",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a731b9.mp3?filename=acoustic-guitars-ambient-10651.mp3",
    duration: "2:10",
    artist: "Acoustic Vibes"
  },
  {
    id: "luxury_ambient_1",
    title: "Luxury Apartment Ambient",
    category: "Luxury & Smooth",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=smooth-waters-115977.mp3",
    duration: "3:15",
    artist: "Ambient Beats"
  },
  {
    id: "upbeat_modern_1",
    title: "Modern City Tour Upbeat",
    category: "Upbeat & Energetic",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=happy-day-113985.mp3",
    duration: "1:48",
    artist: "Upbeat Audio"
  },
  {
    id: "calm_piano_1",
    title: "Serene Living Piano & Strings",
    category: "Piano & Strings",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c35b6b801a.mp3?filename=soft-piano-10875.mp3",
    duration: "2:40",
    artist: "Calm Harmony"
  },
  {
    id: "lofi_relax_2",
    title: "Sunset Balcony Lofi",
    category: "Lofi & Chill",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_248c5e638f.mp3?filename=chill-abstract-intention-12099.mp3",
    duration: "2:05",
    artist: "Lofi Lounge"
  },
  {
    id: "commercial_promo_1",
    title: "Real Estate Showcase Beat",
    category: "Upbeat & Energetic",
    audioUrl: "https://cdn.pixabay.com/download/audio/2021/09/06/audio_91fa1a2f64.mp3?filename=inspiring-cinematic-11234.mp3",
    duration: "2:15",
    artist: "Showcase Audio"
  }
];

export default function AudioSelectorModal({
  isOpen,
  onClose,
  onSelectTrack,
  currentAudioUrl,
  currentAudioTitle
}: AudioSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<"search" | "presets" | "custom">("presets");
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<AudioTrack[]>(DEFAULT_PRESETS);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState(currentAudioUrl || "");
  const [customTitle, setCustomTitle] = useState(currentAudioTitle || "");
  
  // Preview audio player
  const [playingTrackUrl, setPlayingTrackUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/rentals/audio/presets`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        }
      }
    } catch (e) {
      console.warn("Using fallback audio presets:", e);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setTracks(DEFAULT_PRESETS);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/rentals/audio/search?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
          setLoading(false);
          return;
        }
      }

      // Direct Client-Side Audius Music API Search
      const audiusRes = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=dwelly`);
      if (audiusRes.ok) {
        const audiusData = await audiusRes.json();
        if (Array.isArray(audiusData.data) && audiusData.data.length > 0) {
          const mapped: AudioTrack[] = audiusData.data.slice(0, 20).map((t: any) => ({
            id: `audius_${t.id || t.track_id}`,
            title: t.title || "Artist Track",
            artist: t.user?.name || "Artist",
            category: t.genre || "Artist Music",
            audioUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id || t.track_id}/stream?app_name=dwelly`,
            duration: t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : "3:00"
          }));
          setTracks(mapped);
          setLoading(false);
          return;
        }
      }

      const filtered = DEFAULT_PRESETS.filter(
        t => t.title.toLowerCase().includes(query.toLowerCase()) ||
             t.category.toLowerCase().includes(query.toLowerCase())
      );
      setTracks(filtered);
    } catch (e) {
      const filtered = DEFAULT_PRESETS.filter(
        t => t.title.toLowerCase().includes(query.toLowerCase()) ||
             t.category.toLowerCase().includes(query.toLowerCase())
      );
      setTracks(filtered);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPreview = (url: string) => {
    if (playingTrackUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      newAudio.play().catch(e => console.error("Playback error:", e));
      setPlayingTrackUrl(url);

      newAudio.onended = () => {
        setPlayingTrackUrl(null);
      };
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTrackUrl(null);
  };

  const handleModalClose = () => {
    stopAudio();
    onClose();
  };

  const handleSelectTrack = (track: AudioTrack) => {
    stopAudio();
    onSelectTrack({ url: track.audioUrl, title: track.title });
    onClose();
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    stopAudio();
    const title = customTitle.trim() || "Custom Audio Track";
    onSelectTrack({ url: customUrl.trim(), title });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Listing Background Audio & Music</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Search online music or pick a curated track to play over your property</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModalClose();
            }}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 gap-2 bg-zinc-50/50 dark:bg-zinc-900/30">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("presets");
            }}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "presets"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Curated Library
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("search");
            }}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "search"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            <Search className="w-4 h-4" />
            Search Online
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("custom");
            }}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === "custom"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Direct URL / Link
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === "search" && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search royalty-free music (e.g. lofi, acoustic, ambient, upbeat)..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {(activeTab === "presets" || activeTab === "search") && (
            <div className="space-y-2">
              {loading ? (
                <div className="py-12 text-center text-zinc-500 text-sm">Searching online music...</div>
              ) : tracks.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">No music tracks found. Try another search.</div>
              ) : (
                tracks.map((track) => {
                  const isSelected = currentAudioUrl === track.audioUrl;
                  const isPlaying = playingTrackUrl === track.audioUrl;

                  return (
                    <div
                      key={track.id}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-4 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => togglePlayPreview(track.audioUrl)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${
                            isPlaying
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-blue-600 hover:text-white"
                          }`}
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                        </button>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                            {track.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span className="bg-zinc-200 dark:bg-zinc-700/60 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              {track.category}
                            </span>
                            {track.duration && <span>• {track.duration}</span>}
                            {track.artist && <span>• {track.artist}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Selected
                          </>
                        ) : (
                          "Use Music"
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Music Track Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Property Theme Song"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Audio Stream URL (.mp3 / .aac / .wav)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/audio.mp3"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {customUrl && (
                    <button
                      type="button"
                      onClick={() => togglePlayPreview(customUrl)}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-semibold text-xs flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200"
                    >
                      {playingTrackUrl === customUrl ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      Test
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customUrl.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Apply Custom Audio Track
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleModalClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
