import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { useTickets } from '@/lib/contexts/TicketContext';
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon, BugAntIcon } from '@heroicons/react/24/outline';

// List of possible delimiters to try
const DELIMITERS = [',', '\t', ';', '|'];

const FileUploader: React.FC = () => {
  const { setRawData } = useTickets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);

  // Try parsing with different delimiters
  const tryParsingWithDelimiters = (fileContent: string) => {
    console.log('\x1b[36m%s\x1b[0m', '[Debug] Trying multiple delimiters');
    
    // Check if the file might be using Windows line endings
    if (fileContent.indexOf('\r\n') > -1) {
      console.log('\x1b[33m%s\x1b[0m', '[Debug] File appears to use Windows line endings (CRLF)');
      // Replace CRLF with LF to avoid issues
      fileContent = fileContent.replace(/\r\n/g, '\n');
    }
    
    // Try each delimiter
    for (const delimiter of DELIMITERS) {
      const delimiterName = delimiter === ',' ? 'COMMA' : 
                          delimiter === '\t' ? 'TAB' : 
                          delimiter === ';' ? 'SEMICOLON' : 'PIPE';
                          
      console.log('\x1b[36m%s\x1b[0m', `[Debug] Trying delimiter: ${delimiterName}`);
      
      const results = Papa.parse(fileContent, {
        delimiter,
        header: true,
        skipEmptyLines: true
      });
      
      // If we have data and columns match what we expect, use this delimiter
      if (results.data.length > 0 && typeof results.data[0] === 'object' && results.data[0] !== null) {
        const keys = Object.keys(results.data[0] as object);
        if (keys.length > 5) {
          console.log('\x1b[32m%s\x1b[0m', `[Success] Found working delimiter: ${delimiterName}`);
          return { results, delimiter };
        }
      }
    }
    
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setShowDebugger(false);
    setLastFile(file);
    
    // Debug the file before parsing
    console.log('\x1b[36m%s\x1b[0m', '[Debug] File received:', file.name, file.type, file.size);
    
    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLines = text.split('\n').slice(0, 3).join('\n');
      console.log('\x1b[33m%s\x1b[0m', '[Debug] First few lines of file:', firstLines);
      
      // First try automatic parsing
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          console.log('\x1b[32m%s\x1b[0m', '[Debug] Found header:', header);
          return header;
        },
        complete: (results) => {
          console.log('\x1b[36m%s\x1b[0m', '[Debug] Papa Parse initial results:', {
            errors: results.errors,
            meta: results.meta,
            fields: results.meta.fields,
            fieldsCount: results.meta.fields?.length || 0
          });
          
          // If there are errors or not enough fields, try manual delimiter detection
          if (results.errors.length > 0 || !results.meta.fields || results.meta.fields.length < 7) {
            console.log('\x1b[33m%s\x1b[0m', '[Debug] Standard parsing failed, trying with different delimiters');
            
            const manualResults = tryParsingWithDelimiters(text);
            
            if (manualResults) {
              // Process the results
              processResults(manualResults.results);
            } else {
              console.log('\x1b[31m%s\x1b[0m', '[Error] Failed to parse with any delimiter');
              setError('Failed to parse CSV file. Please check the format.');
              setShowDebugger(true);
              setIsProcessing(false);
            }
          } else {
            // Standard parsing worked
            processResults(results);
          }
        },
        error: (error) => {
          console.log('\x1b[31m%s\x1b[0m', '[Error] Initial parse error:', error);
          setError('Error parsing CSV: ' + error.message);
          setShowDebugger(true);
          setIsProcessing(false);
        }
      });
    };
    
    reader.onerror = (e) => {
      console.log('\x1b[31m%s\x1b[0m', '[Error] File read error:', e);
      setError('Error reading file');
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  }, [setRawData]);
  
  // Process the parse results
  const processResults = (results: Papa.ParseResult<any>) => {
    if (results.errors.length > 0) {
      console.log('\x1b[31m%s\x1b[0m', '[Error] Parse errors:', results.errors);
      setError('Error parsing CSV: ' + results.errors[0].message);
      setShowDebugger(true);
      setIsProcessing(false);
      return;
    }
    
    if (results.data.length === 0) {
      console.log('\x1b[31m%s\x1b[0m', '[Error] No data found in CSV file');
      setError('No data found in CSV file');
      setIsProcessing(false);
      return;
    }

    // Check if the first data item is a valid object for parsing
    if (typeof results.data[0] !== 'object' || results.data[0] === null) {
      console.log('\x1b[31m%s\x1b[0m', '[Error] Invalid data structure in CSV file');
      setError('Invalid data structure in CSV file');
      setShowDebugger(true);
      setIsProcessing(false);
      return;
    }
    
    // Validate required columns
    const requiredColumns = ['Created Date', 'Groups', 'ID', 'Agent Name', 'Category', 'Subject', 'Source', 'Priority'];
    const headers = Object.keys(results.data[0] as object);
    
    console.log('\x1b[32m%s\x1b[0m', '[Debug] Available columns:', headers);
    
    // Check for empty column names (which can happen with some CSV formats)
    const hasEmptyColumns = headers.some(h => h.trim() === '');
    if (hasEmptyColumns) {
      console.log('\x1b[31m%s\x1b[0m', '[Error] Found empty column names');
      setError('Your CSV file has empty column names, which is not allowed.');
      setShowDebugger(true);
      setIsProcessing(false);
      return;
    }
    
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\x1b[31m%s\x1b[0m', '[Error] Missing columns:', missingColumns);
      setError(`Missing required columns: ${missingColumns.join(', ')}`);
      setShowDebugger(true);
      setIsProcessing(false);
      return;
    }
    
    // Show preview of first 5 rows
    setPreview(results.data.slice(0, 5));
    
    // Set the data after validation
    setRawData(results.data);
    console.log('\x1b[32m%s\x1b[0m', '[Success] Parsed CSV with', results.data.length, 'rows');
    setIsProcessing(false);
  };

  // Upload file for debugging to the debug API endpoint
  const uploadFileForDebug = async () => {
    if (!lastFile) return;
    
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('file', lastFile);
      
      const response = await fetch('/api/debug/csv-parse', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Debug API request failed');
      }
      
      const result = await response.json();
      console.log('\x1b[36m%s\x1b[0m', '[Debug] CSV analysis result:', result);
      
      // Format debug info
      let debugInfo = '';
      
      if (result.lineEndingInfo?.mixed) {
        debugInfo += '- File has mixed line endings (both Windows and Unix)\n';
      }
      
      if (result.autoDetection?.success === false) {
        debugInfo += '- Auto-detection of delimiter failed\n';
      }
      
      if (result.recommendedDelimiter) {
        debugInfo += `- Recommended delimiter: ${result.recommendedDelimiter}\n`;
      }
      
      if (result.autoDetection?.fields) {
        debugInfo += `- Found ${result.autoDetection.fieldCount} columns: ${result.autoDetection.fields.join(', ')}\n`;
      }
      
      const missingColumns = result.requiredColumns.filter(
        (col: string) => !result.autoDetection?.fields?.includes(col)
      );
      
      if (missingColumns.length > 0) {
        debugInfo += `- Missing required columns: ${missingColumns.join(', ')}\n`;
      }
      
      alert(`CSV File Analysis:\n\n${debugInfo}`);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error analyzing CSV:', error);
      alert('Failed to analyze CSV file');
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.txt', '.csv']
    },
    maxFiles: 1,
  });

  const resetUpload = () => {
    setPreview(null);
    setError(null);
    setShowDebugger(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Upload Ticket Data</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md">
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </p>
          
          {showDebugger && lastFile && (
            <div className="mt-2 flex items-center">
              <button
                onClick={uploadFileForDebug}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <BugAntIcon className="h-4 w-4 mr-1" />
                Diagnose CSV format issues
              </button>
              <span className="text-xs ml-2 text-gray-600 dark:text-gray-400">
                (This will analyze your file and suggest fixes)
              </span>
            </div>
          )}
        </div>
      )}
      
      {preview ? (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Data Preview</h3>
            <button 
              onClick={resetUpload}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="overflow-x-auto max-h-60 overflow-y-auto border dark:border-gray-700 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {preview.length > 0 && Object.keys(preview[0] as object).map(header => (
                    <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {preview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row as object).map((value, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Showing first 5 rows of {preview.length} total rows
          </p>
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                     ${isDragActive 
                       ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                       : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'}`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            {isDragActive ? (
              <div className="flex flex-col items-center">
                <CloudArrowUpIcon className="h-12 w-12 text-blue-500" />
                <p className="mt-2 text-blue-600 dark:text-blue-400">Drop your CSV file here...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Drag and drop your Freshservice CSV export here, or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Only CSV files with the required columns are accepted
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Processing your file...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 