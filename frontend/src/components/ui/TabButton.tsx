import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export default function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors 
                ${active 
                  ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
} 