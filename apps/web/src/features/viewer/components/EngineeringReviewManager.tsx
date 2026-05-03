'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as THREE from 'three';
import { RootState } from '@/store/store';
import { setMeasurements } from '@/store/viewerToolsSlice';
import { apiClient } from '@/lib/apiClient';

interface Version {
  versionId: string;
  versionNumber: number;
  reviewStatus: string;
  createdAt: string;
  snapshotData: unknown;
}

interface Annotation {
  annotationId: string;
  note: string;
  partId?: string;
  createdAt: string;
}

interface DiffPart {
  id: string;
  name: string;
}

interface DiffResponse {
  addedParts: DiffPart[];
  removedParts: DiffPart[];
  modifiedParts: DiffPart[];
  summary: {
    v1Number: number;
    v2Number: number;
    hiddenCountDelta: number;
  };
}

interface EngineeringReviewManagerProps {
  modelId: string;
  onRestoreSnapshot: (snapshot: unknown) => void;
  onHighlightDiff: (diff: DiffResponse) => void;
  onAddAnnotationMarker: (id: string, position: { x: number; y: number; z: number }, note: string) => void;
  onClearAnnotationMarkers: () => void;
}

export function EngineeringReviewManager({
  modelId,
  onRestoreSnapshot,
  onHighlightDiff,
  onAddAnnotationMarker,
  onClearAnnotationMarkers,
}: EngineeringReviewManagerProps) {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<'history' | 'annotations' | 'diff' | 'stats' | 'share'>('history');
  
  // History State
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<string>('DRAFT');

  // Annotation State
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newNote, setNewNote] = useState<string>('');

  // Diff State
  const [v1Id, setV1Id] = useState<string>('');
  const [v2Id, setV2Id] = useState<string>('');
  const [diffData, setDiffData] = useState<DiffResponse | null>(null);

  // Share State
  const [shareUrl, setShareUrl] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number>(7);

  // Redux Viewer state
  const assemblyTree = useSelector((state: RootState) => state.viewer.assemblyTree);
  const hiddenNodeIds = useSelector((state: RootState) => state.viewer.hiddenNodeIds);
  const isolatedNodeIds = useSelector((state: RootState) => state.viewerTools.isolatedNodeIds);
  const explodeFactor = useSelector((state: RootState) => state.viewerTools.explodeFactor);
  const clipping = useSelector((state: RootState) => state.viewerTools.clipping);
  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);
  const measurements = useSelector((state: RootState) => state.viewerTools.measurements);

  // Fetch version history
  const fetchHistory = async () => {
    try {
      const res = await apiClient.get<{ data: Version[] }>(`/models/${modelId}/versions`);
      const originalVersion: Version = {
        versionId: 'original',
        versionNumber: 0,
        reviewStatus: 'ORIGINAL',
        createdAt: '',
        snapshotData: {
          hiddenNodeIds: [],
          isolatedNodeIds: [],
          explodeFactor: 0,
          clipPlanes: { x: 0, y: 0, z: 0, enabled: false },
          camera: undefined,
          orbitTarget: undefined,
          measurements: [],
        },
      };

      const fetched = res.data.data || [];
      const all = [originalVersion, ...fetched];
      setVersions(all);

      if (!selectedVersionId) {
        setSelectedVersionId('original');
      }
    } catch (err) {
      console.error('Failed to fetch versions', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [modelId]);

  // Fetch annotations on version change
  useEffect(() => {
    if (!selectedVersionId) return;
    const fetchAnnotations = async () => {
      try {
        const res = await apiClient.get<{ data: any[] }>(`/versions/${selectedVersionId}/annotations`);
        const list = res.data.data || [];
        setAnnotations(list);

        onClearAnnotationMarkers();
        list.forEach(a => {
          if (a.worldPosition) {
            onAddAnnotationMarker(a.annotationId, a.worldPosition, a.note);
          }
        });
      } catch (err) {
        console.error('Failed to fetch annotations', err);
      }
    };
    fetchAnnotations();
  }, [selectedVersionId]);

  // Handle Save Review Version
  const handleSaveReview = async () => {
    try {
      let camera: { x: number; y: number; z: number } | undefined;
      let orbitTarget: { x: number; y: number; z: number } | undefined;

      if (typeof window !== 'undefined' && (window as any).viewerEngine) {
        const eng = (window as any).viewerEngine;
        if (eng.camera) {
          camera = {
            x: eng.camera.position.x,
            y: eng.camera.position.y,
            z: eng.camera.position.z,
          };
        }
        if (eng.controls && eng.controls.target) {
          orbitTarget = {
            x: eng.controls.target.x,
            y: eng.controls.target.y,
            z: eng.controls.target.z,
          };
        }
      }

      const snapshotData = {
        hiddenNodeIds,
        isolatedNodeIds,
        explodeFactor,
        clipPlanes: {
          x: clipping.planes.x,
          y: clipping.planes.y,
          z: clipping.planes.z,
          enabled: clipping.enabled,
        },
        camera,
        orbitTarget,
        measurements,
      };

      await apiClient.post(`/models/${modelId}/reviews`, {
        reviewStatus,
        snapshotData,
      });

      alert('Review snapshot saved successfully.');
      fetchHistory();
    } catch (err) {
      console.error('Failed to save review', err);
      alert('Could not save review version snapshot.');
    }
  };

  // Replay Version Snapshot
  const handleReplayVersion = (v: Version) => {
    setSelectedVersionId(v.versionId);
    onRestoreSnapshot(v.snapshotData);
  };

  const handleDeleteVersion = async (vId: string) => {
    if (vId === 'original') return;
    if (!window.confirm('Are you sure you want to delete this version?')) return;
    try {
      await apiClient.delete(`/versions/${vId}`);
      if (selectedVersionId === vId) {
        setSelectedVersionId('original');
      }
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete version', err);
    }
  };

  const handleDeleteAllVersions = async () => {
    if (!window.confirm('Are you sure you want to delete all versions except the original base state?')) return;
    try {
      await apiClient.delete(`/models/${modelId}/versions/clear-all`);
      setSelectedVersionId('original');
      fetchHistory();
    } catch (err) {
      console.error('Failed to delete all versions', err);
    }
  };

  // Create Annotation
  const handleCreateAnnotation = async () => {
    if (!selectedVersionId) {
      alert('Please select or create a review version first.');
      return;
    }
    if (!newNote.trim()) return;

    try {
      let pos = { x: 0, y: 0, z: 0 };
      if (typeof window !== 'undefined' && (window as any).viewerEngine) {
        const eng = (window as any).viewerEngine;
        if (eng.selectedMesh) {
          const box = new THREE.Box3().setFromObject(eng.selectedMesh);
          const center = new THREE.Vector3();
          box.getCenter(center);
          pos = { x: center.x, y: center.y, z: center.z };
        } else if (eng.controls && eng.controls.target) {
          pos = { x: eng.controls.target.x, y: eng.controls.target.y, z: eng.controls.target.z };
        }
      }

      const res = await apiClient.post<{ data: Annotation }>(`/versions/${selectedVersionId}/annotations`, {
        note: newNote,
        partId: selectedNodeId || undefined,
        worldPosition: pos,
      });
      setAnnotations(prev => [...prev, res.data.data]);
      setNewNote('');
      onAddAnnotationMarker(res.data.data.annotationId, pos, newNote);
    } catch (err) {
      console.error('Failed to create annotation', err);
    }
  };

  // Delete Annotation
  const handleDeleteAnnotation = async (id: string) => {
    try {
      await apiClient.delete(`/annotations/${id}`);
      setAnnotations(prev => prev.filter(a => a.annotationId !== id));
    } catch (err) {
      console.error('Failed to delete annotation', err);
    }
  };

  // Compare Versions
  const handleCompareVersions = async () => {
    if (!v1Id || !v2Id) {
      alert('Please select both versions to perform diffing.');
      return;
    }
    try {
      const res = await apiClient.get<{ data: DiffResponse }>(
        `/models/${modelId}/versions/compare?v1Id=${v1Id}&v2Id=${v2Id}`
      );
      setDiffData(res.data.data);
      onHighlightDiff(res.data.data);
    } catch (err) {
      console.error('Failed to compare versions', err);
    }
  };

  // Generate Share Link
  const handleGenerateShareLink = async () => {
    if (!selectedVersionId) return;
    try {
      const exp = new Date();
      exp.setDate(exp.getDate() + expiresInDays);

      const res = await apiClient.post<{ data: { token: string } }>(`/versions/${selectedVersionId}/share`, {
        expiresAt: exp.toISOString(),
        permissions: 'READ_ONLY',
      });
      
      const loc = typeof window !== 'undefined' ? window.location.origin : '';
      setShareUrl(`${loc}/share/${res.data.data.token}`);
    } catch (err) {
      console.error('Failed to create share link', err);
    }
  };


  // Traverse Assembly Tree for advanced CAD metrics
  const computeStats = () => {
    let totalParts = 0;
    let maxDepth = 0;

    const traverse = (node: any, depth: number) => {
      totalParts++;
      if (depth > maxDepth) maxDepth = depth;
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverse(child, depth + 1));
      }
    };

    if (assemblyTree) {
      traverse(assemblyTree, 1);
    }

    return {
      totalParts,
      maxDepth,
      visibleParts: Math.max(0, totalParts - hiddenNodeIds.length),
      hiddenParts: hiddenNodeIds.length,
      isolatedParts: isolatedNodeIds.length,
      complexityScore: Math.min(100, Math.round((totalParts * 1.5) + (maxDepth * 5))),
    };
  };

  const stats = computeStats();

  return (
    <div className="w-full h-full flex flex-col font-sans select-none overflow-hidden bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>

      {/* Tab Controls */}
      <div className="flex bg-slate-950/40 border-b border-slate-800/80 p-2 gap-1 overflow-x-auto text-[11px] font-black uppercase tracking-wider select-none shrink-0 custom-scrollbar">
        {[
          { key: 'history', label: 'History' },
          { key: 'annotations', label: 'Notes' },
          { key: 'diff', label: 'Diff' },
          { key: 'stats', label: 'Stats' },
          { key: 'share', label: 'Share' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-3 rounded-xl border text-center transition-all duration-300 select-none outline-none ${
              activeTab === tab.key
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col text-xs text-slate-200 custom-scrollbar">
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            {/* New Version Snapshot Capture form */}
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 flex flex-col gap-3">
              <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none">
                Save Review Session
              </h4>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase select-none">
                  Review Status
                </label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs outline-none select-none focus:border-indigo-500 transition-colors"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
              </div>
              <button
                onClick={handleSaveReview}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl border border-indigo-500 transition-all duration-300 uppercase tracking-widest text-[10px] select-none hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Version Snapshot
              </button>
            </div>

            {/* Version List */}
            <div className="flex flex-col gap-3">
              <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none border-b border-slate-800/60 pb-1 flex justify-between items-center">
                Review History 
                <button
                  onClick={handleDeleteAllVersions}
                  className="bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 hover:border-rose-500 text-rose-300 font-extrabold text-[9px] px-2 py-1 rounded-xl transition-all"
                >
                  Clear All
                </button>
              </h4>
              {versions.length === 0 ? (
                <div className="text-slate-500 italic p-2 text-center">
                  No versions saved yet.
                </div>
              ) : (
                versions.map(v => (
                  <div
                    key={v.versionId}
                    onClick={() => handleReplayVersion(v)}
                    className={`bg-slate-900/60 hover:bg-slate-800/60 border p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all duration-200 select-none ${
                      selectedVersionId === v.versionId
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-white">Version {v.versionNumber}</span>
                      <span className="font-mono text-[10px] text-indigo-300">Status: {v.reviewStatus}</span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Base CAD State'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/40 border border-indigo-800 px-2 py-1 rounded-lg">
                        REPLAY
                      </span>
                      {v.versionId !== 'original' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVersion(v.versionId);
                          }}
                          className="text-[10px] font-black text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-500 px-2 py-1 rounded-lg transition-all"
                        >
                          DEL
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'annotations' && (
          <div className="flex flex-col gap-4 h-full">
            <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none border-b border-slate-800/60 pb-1 flex justify-between items-center">
              Annotation Review Notes
            </h4>
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 flex flex-col gap-2.5">
              <textarea
                placeholder="Type your review note or observation..."
                rows={3}
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors font-sans resize-none select-none"
              />
              <button
                onClick={handleCreateAnnotation}
                disabled={!selectedVersionId}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-xl border border-indigo-500 transition-all duration-300 uppercase tracking-widest text-[10px] select-none"
              >
                Create Annotation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 select-none">
              {annotations.length === 0 ? (
                <div className="text-slate-500 italic p-2 text-center">
                  No review notes for this version.
                </div>
              ) : (
                annotations.map(a => (
                  <div
                    key={a.annotationId}
                    className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex justify-between items-center transition-all duration-200 select-none hover:bg-slate-800/40"
                  >
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="text-white font-medium break-words leading-tight">{a.note}</span>
                      {a.partId && (
                        <span className="text-[10px] font-mono text-teal-400 font-black truncate">
                          Node: {a.partId}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAnnotation(a.annotationId)}
                      className="text-rose-400 hover:text-rose-300 font-extrabold text-xs transition-colors shrink-0 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'diff' && (
          <div className="flex flex-col gap-4">
            <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none border-b border-slate-800/60 pb-1">
              Engineering Diff Comparison
            </h4>
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase select-none">
                    Version A (Baseline)
                  </label>
                  <select
                    value={v1Id}
                    onChange={e => setV1Id(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors select-none"
                  >
                    <option value="">Select version</option>
                    {versions.map(v => (
                      <option key={v.versionId} value={v.versionId}>
                        V{v.versionNumber} ({v.reviewStatus})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase select-none">
                    Version B (Comparison)
                  </label>
                  <select
                    value={v2Id}
                    onChange={e => setV2Id(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 px-2 py-1.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors select-none"
                  >
                    <option value="">Select version</option>
                    {versions.map(v => (
                      <option key={v.versionId} value={v.versionId}>
                        V{v.versionNumber} ({v.reviewStatus})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCompareVersions}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl border border-indigo-500 transition-all duration-300 uppercase tracking-widest text-[10px] select-none hover:scale-[1.02] active:scale-[0.98]"
              >
                Perform Model Diff
              </button>
            </div>

            {diffData && (
              <div className="flex flex-col gap-3">
                <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none border-b border-slate-800/60 pb-1">
                  Comparison Result
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/60 p-3 border border-emerald-800/60 rounded-xl flex flex-col select-none">
                    <span className="text-emerald-400 font-extrabold text-[10px] uppercase">
                      Added Node Differences
                    </span>
                    <span className="text-lg font-black text-white">{diffData.addedParts.length}</span>
                  </div>
                  <div className="bg-slate-900/60 p-3 border border-rose-800/60 rounded-xl flex flex-col select-none">
                    <span className="text-rose-400 font-extrabold text-[10px] uppercase">
                      Removed Node Differences
                    </span>
                    <span className="text-lg font-black text-white">{diffData.removedParts.length}</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 max-h-[180px] overflow-y-auto select-none">
                  <h5 className="font-extrabold uppercase text-[10px] text-slate-400 mb-2">
                    Diff Parts Tree
                  </h5>
                  {diffData.addedParts.map(p => (
                    <div key={p.id} className="text-emerald-400 font-mono text-[11px] truncate mb-1">
                      + [ADD] {p.name || p.id}
                    </div>
                  ))}
                  {diffData.removedParts.map(p => (
                    <div key={p.id} className="text-rose-400 font-mono text-[11px] truncate mb-1">
                      - [REM] {p.name || p.id}
                    </div>
                  ))}
                  {diffData.addedParts.length === 0 && diffData.removedParts.length === 0 && (
                    <div className="text-slate-500 italic text-[11px] text-center p-1">
                      No part additions or removals found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex flex-col gap-4">
            <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none border-b border-slate-800/60 pb-1">
              Advanced Engineering Stats
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col select-none">
                <span className="text-slate-400 font-medium text-[10px] uppercase mb-1">Total Parts</span>
                <span className="text-lg font-black font-mono text-teal-400">{stats.totalParts}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col select-none">
                <span className="text-slate-400 font-medium text-[10px] uppercase mb-1">Depth</span>
                <span className="text-lg font-black font-mono text-teal-400">{stats.maxDepth}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-800/40 flex flex-col select-none">
                <span className="text-emerald-400 font-medium text-[10px] uppercase mb-1">Visible Parts</span>
                <span className="text-lg font-black font-mono text-emerald-300">{stats.visibleParts}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-rose-800/40 flex flex-col select-none">
                <span className="text-rose-400 font-medium text-[10px] uppercase mb-1">Hidden Parts</span>
                <span className="text-lg font-black font-mono text-rose-300">{stats.hiddenParts}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-800/40 col-span-2 flex justify-between items-center select-none">
                <div className="flex flex-col">
                  <span className="text-indigo-400 font-medium text-[10px] uppercase mb-1">Complexity Rating</span>
                  <span className="text-sm font-black text-white">{stats.complexityScore}/100</span>
                </div>
                <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 select-none">
                  <div
                    className="h-full bg-indigo-500 rounded-full select-none"
                    style={{ width: `${stats.complexityScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'share' && (
          <div className="flex flex-col gap-4">
            <h4 className="font-extrabold text-indigo-400 uppercase text-[10px] tracking-wider select-none border-b border-slate-800/60 pb-1">
              Collaborative Inspection Link
            </h4>
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-400 font-bold uppercase select-none">
                  Link Valid Duration (Days)
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={e => setExpiresInDays(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors select-none font-mono"
                />
              </div>

              <button
                onClick={handleGenerateShareLink}
                disabled={!selectedVersionId}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl border border-indigo-500 transition-all duration-300 uppercase tracking-widest text-[10px] select-none hover:scale-[1.02] active:scale-[0.98]"
              >
                Generate Link
              </button>
            </div>

            {shareUrl && (
              <div className="bg-indigo-950/20 border border-indigo-800/40 p-3.5 rounded-xl flex flex-col gap-2.5 select-none">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[10px] text-indigo-400 uppercase tracking-widest">
                    Share Link Token Generated
                  </span>
                  <span className="text-emerald-400 font-black text-[9px] bg-emerald-950/50 border border-emerald-800 px-1.5 py-0.5 rounded uppercase">
                    Ready to copy
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onClick={e => (e.target as HTMLInputElement).select()}
                  className="bg-slate-950 border border-slate-800 text-slate-200 p-2.5 font-mono rounded-xl text-[10px] w-full outline-none focus:border-indigo-500 select-all"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
