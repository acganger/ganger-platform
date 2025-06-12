'use client'

import React from 'react';

const SkipLinks = () => {
  return (
    <div className="sr-only focus:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 p-4 bg-primary-600 text-white focus:block focus:outline-none focus:ring-2 focus:ring-primary-300"
        onFocus={(e) => {
          e.target.style.position = 'fixed';
          e.target.style.top = '0';
          e.target.style.left = '0';
        }}
        onBlur={(e) => {
          e.target.style.position = 'absolute';
        }}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-0 left-0 z-50 p-4 bg-primary-600 text-white focus:block focus:outline-none focus:ring-2 focus:ring-primary-300"
        onFocus={(e) => {
          e.target.style.position = 'fixed';
          e.target.style.top = '0';
          e.target.style.left = '0';
        }}
        onBlur={(e) => {
          e.target.style.position = 'absolute';
        }}
      >
        Skip to navigation
      </a>
      <a
        href="#filters"
        className="absolute top-0 left-0 z-50 p-4 bg-primary-600 text-white focus:block focus:outline-none focus:ring-2 focus:ring-primary-300"
        onFocus={(e) => {
          e.target.style.position = 'fixed';
          e.target.style.top = '0';
          e.target.style.left = '0';
        }}
        onBlur={(e) => {
          e.target.style.position = 'absolute';
        }}
      >
        Skip to filters
      </a>
    </div>
  );
};

export default SkipLinks;