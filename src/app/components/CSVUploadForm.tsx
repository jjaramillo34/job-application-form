'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parse } from 'csv-parse/sync';

interface PreviewData {
  firstName: string;
  lastName: string;
  email: string;
  program: string;
  site: string;
  workPreferences: {
    bronx: boolean;
    brooklyn: boolean;
    queens: boolean;
    statenIsland: boolean;
    manhattan: boolean;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    weekend: boolean;
  };
  fingerprintQuestionnaire: boolean;
  documentsVerified: boolean;
  attendanceVerified: boolean;
}

export default function CSVUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setSuccess(false);
    setPreviewData([]);
    
    if (acceptedFiles.length === 0) {
      setError('Please upload a CSV file');
      return;
    }

    const uploadedFile = acceptedFiles[0];
    if (uploadedFile.type !== 'text/csv' && !uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }

    // Read and parse the file for preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        console.log('CSV Content:', text); // Debug log

        const records = parse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          skipRecordsWithError: true
        });

        console.log('Parsed Records:', records); // Debug log

        if (!records || records.length === 0) {
          setError('No valid records found in the CSV file');
          return;
        }

        // Process records for preview
        const previewRecords = records.map((record: any) => {
          console.log('Processing record:', record); // Debug log

          // Ensure all required fields are present
          if (!record.firstName || !record.lastName || !record.program || !record.site) {
            throw new Error('Missing required fields in CSV');
          }

          return {
            firstName: record.firstName,
            lastName: record.lastName,
            email: record.email || '',
            program: record.program,
            site: record.site,
            workPreferences: {
              bronx: record.bronx?.toLowerCase() === 'true' || record.bronx?.toLowerCase() === 'yes',
              brooklyn: record.brooklyn?.toLowerCase() === 'true' || record.brooklyn?.toLowerCase() === 'yes',
              queens: record.queens?.toLowerCase() === 'true' || record.queens?.toLowerCase() === 'yes',
              statenIsland: record.statenIsland?.toLowerCase() === 'true' || record.statenIsland?.toLowerCase() === 'yes',
              manhattan: record.manhattan?.toLowerCase() === 'true' || record.manhattan?.toLowerCase() === 'yes',
              morning: record.morning?.toLowerCase() === 'true' || record.morning?.toLowerCase() === 'yes',
              afternoon: record.afternoon?.toLowerCase() === 'true' || record.afternoon?.toLowerCase() === 'yes',
              evening: record.evening?.toLowerCase() === 'true' || record.evening?.toLowerCase() === 'yes',
              weekend: record.weekend?.toLowerCase() === 'true' || record.weekend?.toLowerCase() === 'yes'
            },
            fingerprintQuestionnaire: record.fingerprintQuestionnaire?.toLowerCase() === 'true' || record.fingerprintQuestionnaire?.toLowerCase() === 'yes',
            documentsVerified: record.documentsVerified?.toLowerCase() === 'true' || record.documentsVerified?.toLowerCase() === 'yes',
            attendanceVerified: record.attendanceVerified?.toLowerCase() === 'true' || record.attendanceVerified?.toLowerCase() === 'yes'
          };
        });

        console.log('Preview Records:', previewRecords); // Debug log
        setPreviewData(previewRecords);
        setFile(uploadedFile);
      } catch (err) {
        console.error('CSV parsing error:', err);
        setError(err instanceof Error ? err.message : 'Error reading CSV file. Please check the format.');
      }
    };

    reader.onerror = () => {
      setError('Error reading the file');
    };

    reader.readAsText(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload file');
      }

      const result = await response.json();
      setSuccess(true);
      setFile(null);
      setPreviewData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-500 font-medium">Drop the CSV file here</p>
          ) : (
            <div>
              <p className="text-gray-600 font-medium">Drag and drop your CSV file here</p>
              <p className="text-gray-500 text-sm mt-1">or click to select a file</p>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-gray-400 mr-3" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewData([]);
              }}
              className="ml-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Data ({previewData.length} records)</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Preferences</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.firstName} {record.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.program}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(record.workPreferences).map(([key, value]) => (
                          value && (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          )
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        {record.fingerprintQuestionnaire && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Fingerprint
                          </span>
                        )}
                        {record.documentsVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Documents
                          </span>
                        )}
                        {record.attendanceVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Attendance
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-400 mr-3" />
            <p className="text-sm text-green-700">File uploaded successfully!</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
            ${!file || uploading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            'Upload CSV'
          )}
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Download the template CSV file to ensure correct formatting</li>
            <li>Fill in the required information for each applicant</li>
            <li>Save the file in CSV format</li>
            <li>Upload the file using the form above</li>
            <li>Review the preview data before uploading</li>
            <li>Click Upload CSV to process the applications</li>
          </ul>
          <div className="mt-4">
            <a
              href="/template.csv"
              download
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Template CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 