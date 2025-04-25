"use client";

import React, { useState, Fragment, ReactNode, useEffect } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  downloadAction?: () => void;
  footer?: string;
  extraControls?: ReactNode;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ 
  title, 
  children, 
  downloadAction,
  footer,
  extraControls
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Track screen size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Set initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Regular Chart Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="View fullscreen"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
            
            {downloadAction && (
              <button
                onClick={downloadAction}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Download data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {extraControls && (
          <div className="mb-3">
            {extraControls}
          </div>
        )}
        
        <div className="flex-grow select-none">
          {children}
        </div>
        
        {footer && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            {footer}
          </div>
        )}
      </div>
      
      {/* Improved Fullscreen Modal */}
      <Transition appear show={isFullscreen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-50" 
          onClose={() => setIsFullscreen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-[95vw] h-[90vh] transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title
                      as="h3"
                      className="text-xl font-semibold leading-6 text-gray-900 dark:text-white"
                    >
                      {title}
                    </Dialog.Title>
                    <div className="flex space-x-2">
                      {downloadAction && (
                        <button
                          onClick={downloadAction}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Download data"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => setIsFullscreen(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Close fullscreen"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {extraControls && (
                    <div className="mb-3">
                      {extraControls}
                    </div>
                  )}
                  
                  <div className="h-[calc(100%-4rem)] select-none" style={{ maxHeight: 'calc(90vh - 6rem)' }}>
                    {children}
                  </div>
                  
                  {footer && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                      {footer}
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ChartWrapper; 