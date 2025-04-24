import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

// List of possible delimiters to try
const DELIMITERS = [',', '\t', ';', '|'];

export async function POST(req: NextRequest) {
  try {
    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Get a preview of the file for debugging
    const previewLines = fileContent.split('\n').slice(0, 10);
    const filePreview = previewLines.join('\n');
    
    // Check for different line endings
    const hasWindowsLineEndings = fileContent.includes('\r\n');
    const hasUnixLineEndings = fileContent.includes('\n');
    const lineEndingInfo = {
      windows: hasWindowsLineEndings,
      unix: hasUnixLineEndings,
      mixed: hasWindowsLineEndings && hasUnixLineEndings,
    };
    
    // Try parsing with auto-detected delimiter
    const autoResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    
    // Check if auto-parsing worked well
    const autoSuccess = autoResult.errors.length === 0 && 
                      autoResult.meta.fields && 
                      autoResult.meta.fields.length > 5;
    
    // Results for each delimiter
    const delimiterResults = DELIMITERS.map(delimiter => {
      const result = Papa.parse(fileContent, {
        delimiter,
        header: true,
        skipEmptyLines: true,
        preview: 5
      });
      
      return {
        delimiter: delimiter === '\t' ? 'TAB' : delimiter,
        fields: result.meta.fields || [],
        fieldCount: result.meta.fields?.length || 0,
        errors: result.errors.length > 0,
        sample: result.data.slice(0, 2)
      };
    });
    
    // Find the best delimiter based on field count
    const bestDelimiter = [...delimiterResults].sort((a, b) => b.fieldCount - a.fieldCount)[0];
    
    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lineEndingInfo,
      filePreview,
      autoDetection: {
        success: autoSuccess,
        delimiter: autoResult.meta.delimiter,
        fields: autoResult.meta.fields,
        fieldCount: autoResult.meta.fields?.length || 0,
        errors: autoResult.errors
      },
      delimiterTests: delimiterResults,
      recommendedDelimiter: bestDelimiter.delimiter,
      requiredColumns: ['Created Date', 'Groups', 'ID', 'Agent Name', 'Category', 'Subject', 'Source', 'Priority'],
    });
    
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json({ error: 'Error parsing CSV file' }, { status: 500 });
  }
} 