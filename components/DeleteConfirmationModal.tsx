import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'tool' | 'news';
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  itemType 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-red-900/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-900/30">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete {itemType === 'tool' ? 'Tool' : 'Article'}?</h3>
            <p className="text-zinc-400 text-sm">
              Are you sure you want to delete <strong className="text-white">"{itemName}"</strong>?
              <br />
              This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;