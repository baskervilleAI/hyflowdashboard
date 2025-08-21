import React from 'react';

interface EyeIconProps {
  isPinned?: boolean;
}

const EyeIcon: React.FC<EyeIconProps> = ({ isPinned }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={isPinned ? '#6a1b9a' : '#333'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default EyeIcon;

