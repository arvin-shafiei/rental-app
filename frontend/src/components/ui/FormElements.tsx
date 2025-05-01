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

// Toast component
export const Toast = ({ title, description, variant, visible, onClose }: any) => {
  if (!visible) return null;
  
  return (
    <div className={`fixed top-4 right-4 left-4 p-4 rounded-md shadow-md z-50 flex justify-between items-center ${
      variant === 'destructive' ? 'bg-red-100 border-red-400 text-red-800' : 'bg-green-100 border-green-400 text-green-800'
    }`}>
      <div>
        {title && <h4 className="font-semibold">{title}</h4>}
        {description && <p>{description}</p>}
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

// Toast container and manager
let toastTimeout: NodeJS.Timeout | null = null;

export const toast = ({ title, description, variant }: any) => {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '0';
    toastContainer.style.left = '0';
    toastContainer.style.right = '0';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  // Clear existing toasts and timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastContainer.innerHTML = '';
  
  // Create toast element
  const toastElement = document.createElement('div');
  toastElement.className = `py-2 px-4 text-sm ${
    variant === 'destructive' ? 'bg-red-100 border-b border-red-400 text-red-800' : 'bg-green-100 border-b border-green-400 text-green-800'
  }`;
  
  // Create a function to close the toast
  const closeToast = () => {
    toastElement.style.transition = 'opacity 0.3s';
    toastElement.style.opacity = '0';
    
    setTimeout(() => {
      toastElement.remove();
    }, 300);
  };
  
  // Create wrapper for content
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'max-w-6xl mx-auto flex justify-between items-center';
  
  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.className = 'flex items-center';
  
  // Create icon
  const icon = document.createElement('span');
  icon.className = 'mr-2 inline-flex';
  icon.innerHTML = variant === 'destructive'
    ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
    : '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
  
  messageContainer.appendChild(icon);
  
  // Create text content
  if (title && description) {
    const titleSpan = document.createElement('span');
    titleSpan.className = 'font-medium';
    titleSpan.textContent = `${title}: `;
    messageContainer.appendChild(titleSpan);
    
    const descSpan = document.createElement('span');
    descSpan.textContent = description;
    messageContainer.appendChild(descSpan);
  } else {
    const textSpan = document.createElement('span');
    textSpan.textContent = title || description || '';
    messageContainer.appendChild(textSpan);
  }
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'text-gray-500 hover:text-gray-700 ml-2 focus:outline-none';
  closeButton.setAttribute('aria-label', 'Close toast');
  closeButton.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
  closeButton.onclick = closeToast;
  
  // Assemble the toast
  contentWrapper.appendChild(messageContainer);
  contentWrapper.appendChild(closeButton);
  toastElement.appendChild(contentWrapper);
  
  // Add to container
  toastContainer.appendChild(toastElement);
  
  // Auto-remove after 3 seconds
  toastTimeout = setTimeout(() => {
    closeToast();
  }, 3000);
}; 