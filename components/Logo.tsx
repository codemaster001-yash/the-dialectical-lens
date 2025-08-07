import React from 'react';

export const Logo: React.FC<{className?: string}> = ({ className }) => (
    <svg 
        className={className}
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="6"
    >
        <circle 
            cx="40" 
            cy="50" 
            r="30" 
            className="text-light-accent/70 dark:text-dark-accent/70"
            strokeDasharray="188.5"
            strokeDashoffset="0"
        />
        <circle 
            cx="60" 
            cy="50" 
            r="30" 
            className="text-light-accent dark:text-dark-accent"
        />
    </svg>
);
