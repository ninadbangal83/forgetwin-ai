import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface MetadataPanelProps {
  globalMetadata: any;
}

export function MetadataPanel({ globalMetadata }: MetadataPanelProps) {
  const tree = useSelector((state: RootState) => state.viewer.assemblyTree);
  const selectedNodeId = useSelector((state: RootState) => state.viewer.selectedNodeId);

  // Helper to find node in tree
  const findNode = (node: any, id: string): any => {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = selectedNodeId ? findNode(tree, selectedNodeId) : null;

  return (
    <div className="w-full h-full flex flex-col font-sans text-sm text-slate-200">
      {!selectedNode ? (
        <div className="text-slate-500 italic p-4 text-center text-xs select-none">
          Select a part or sub-assembly from the viewer or hierarchy to inspect its engineering properties.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Core Identity */}
          <div>
            <h3 className="font-extrabold text-slate-500 text-[10px] uppercase tracking-widest mb-2 border-b border-slate-800/80 pb-1">Identification</h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col">
                <span className="text-slate-400 font-medium mb-0.5">Part Name</span>
                <span className="font-bold text-white break-words">{selectedNode.name || 'Unnamed Body'}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col">
                <span className="text-slate-400 font-medium mb-0.5">Type</span>
                <span className="font-mono text-indigo-400 font-bold">{selectedNode.type}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col">
                <span className="text-slate-400 font-medium mb-0.5">Global UUID</span>
                <span className="font-mono text-slate-400 truncate" title={selectedNode.id}>{selectedNode.id}</span>
              </div>
            </div>
          </div>

          {/* Physical Properties (if available from Python extraction) */}
          {selectedNode.metrics && (
            <div>
              <h3 className="font-extrabold text-slate-500 text-[10px] uppercase tracking-widest mb-2 border-b border-slate-800/80 pb-1">Physical Metrics</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedNode.metrics.vertices !== undefined && (
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col">
                    <span className="text-slate-400 font-medium mb-0.5">Vertices</span>
                    <span className="font-mono font-bold text-teal-400">{selectedNode.metrics.vertices.toLocaleString()}</span>
                  </div>
                )}
                {selectedNode.metrics.faces !== undefined && (
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col">
                    <span className="text-slate-400 font-medium mb-0.5">Polygons</span>
                    <span className="font-mono font-bold text-teal-400">{selectedNode.metrics.faces.toLocaleString()}</span>
                  </div>
                )}
                {selectedNode.metrics.isInstanced && (
                  <div className="col-span-2 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40 flex flex-col">
                    <span className="font-bold text-indigo-300">GPU Instanced geometry</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Metadata always shows at the bottom */}
      <div className="mt-auto pt-6">
        <h3 className="font-extrabold text-slate-500 text-[10px] uppercase tracking-widest mb-2 border-b border-slate-800/80 pb-1">Global CAD Document</h3>
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Quality Profile</span>
            <span className="font-bold text-white">{globalMetadata?.quality || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-medium">Unique Solids</span>
            <span className="font-bold text-white">{globalMetadata?.uniqueShapes || 'N/A'}</span>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-slate-400 font-medium">Physical Entities</span>
            <span className="font-bold text-white">{globalMetadata?.totalInstances || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
