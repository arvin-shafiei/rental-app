import React from 'react';

// Button component
export const Button = ({ children, className, onClick, variant, size, disabled }: any) => (
  <button 
    className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
    onClick={onClick} 
    disabled={disabled}
  >
    {children}
  </button>
);

// Card components
export const Card = ({ children }: any) => <div className="border rounded-md p-6">{children}</div>;
export const CardHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
export const CardTitle = ({ children }: any) => <h2 className="text-xl font-bold text-black">{children}</h2>;
export const CardDescription = ({ children }: any) => <p className="text-gray-700 text-sm">{children}</p>;
export const CardContent = ({ children, className }: any) => <div className={className}>{children}</div>;

// Input component
export const Input = ({ id, placeholder, value, onChange, className }: any) => (
  <input 
    id={id} 
    placeholder={placeholder} 
    value={value} 
    onChange={onChange} 
    className={`border rounded-md p-2 w-full text-black ${className || ''}`} 
  />
);

// Label component
export const Label = ({ htmlFor, children }: any) => (
  <label htmlFor={htmlFor} className="font-medium mb-1 block text-black">{children}</label>
);

// Checkbox component
export const Checkbox = ({ id, checked, onCheckedChange, disabled }: any) => (
  <input 
    type="checkbox" 
    id={id} 
    checked={checked} 
    onChange={(e) => onCheckedChange(e.target.checked)} 
    disabled={disabled}
  />
);

// Select component
export const Select = ({ children, onValueChange, value, placeholder }: any) => (
  <div className="relative">
    <select 
      value={value || ""} 
      onChange={(e) => onValueChange && onValueChange(e.target.value)} 
      className="border rounded-md p-2 w-full appearance-none text-black"
      aria-label={placeholder}
    >
      <option value="" disabled className="text-gray-500">{placeholder || 'Select an option'}</option>
      {children}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

// SelectItem component
export const SelectItem = ({ value, children }: any) => (
  <option value={value} className="text-black">{children}</option>
);

// Toast function (placeholder)
export const toast = ({ title, description, variant }: any) => {
  console.log(`${title}: ${description}`);
  alert(`${title}: ${description}`);
}; 