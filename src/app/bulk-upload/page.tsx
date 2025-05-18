'use client';

import { useState } from 'react';
import { Upload, Download, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import Link from 'next/link';

interface Record {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  counselor_email: string;
  ssn: string;
  dateOfBirth: string;
  program: string;
  site: string;
  lcgmsCode: string;
  geographicDistrict: string;
  bronx: boolean;
  brooklyn: boolean;
  queens: boolean;
  statenIsland: boolean;
  manhattan: boolean;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  weekend: boolean;
  fingerprintQuestionnaire: boolean;
  documentsVerified: boolean;
  attendanceVerified: boolean;
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setRecords([]);
      setUploadProgress(0);
    }
  };

  const processCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRecords = results.data.map((row: any) => ({
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          address: row.address || '',
          city: row.city || '',
          state: row.state || 'NY',
          zipCode: row.zipCode || '',
          phone: row.phone || '',
          email: row.email || '',
          counselor_email: row.counselor_email || '',
          ssn: row.ssn || '',
          dateOfBirth: row.dateOfBirth || '',
          program: row.program || '',
          site: row.site || '',
          lcgmsCode: row.lcgmsCode || '',
          geographicDistrict: row.geographicDistrict || '',
          bronx: row.bronx === 'true',
          brooklyn: row.brooklyn === 'true',
          queens: row.queens === 'true',
          statenIsland: row.statenIsland === 'true',
          manhattan: row.manhattan === 'true',
          morning: row.morning === 'true',
          afternoon: row.afternoon === 'true',
          evening: row.evening === 'true',
          weekend: row.weekend === 'true',
          fingerprintQuestionnaire: row.fingerprintQuestionnaire === 'true',
          documentsVerified: row.documentsVerified === 'true',
          attendanceVerified: row.attendanceVerified === 'true',
        }));
        setRecords(parsedRecords);
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    try {
      processCSV(file);
      const totalRecords = records.length;
      let processedRecords = 0;
      let successfulUploads = 0;

      for (const record of records) {
        try {
          const response = await fetch('/api/submit-application', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
          });

          if (!response.ok) {
            throw new Error(`Failed to upload record: ${response.statusText}`);
          }

          processedRecords++;
          successfulUploads++;
          setUploadProgress((processedRecords / totalRecords) * 100);
        } catch (error) {
          console.error('Error uploading record:', error);
          setError(`Failed to upload record ${processedRecords + 1}`);
          break;
        }
      }

      if (successfulUploads > 0) {
        setSuccessMessage(`Successfully uploaded ${successfulUploads} student${successfulUploads === 1 ? '' : 's'}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bulk Upload Applications</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Important Instructions</h2>
            <ul className="list-disc list-inside text-blue-700 space-y-2">
              <li>Download the template CSV file to ensure correct formatting</li>
              <li>All fields marked with * are required</li>
              <li>Make sure all email addresses are valid</li>
              <li>SSN must be in XXX-XX-XXXX format</li>
              <li>Date of birth must be in YYYY-MM-DD format</li>
              <li>Boolean fields (boroughs, time preferences, verifications) should be "true" or "false"</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Link
              href="/api/template"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Link>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
            </div>
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              Selected file: {file.name}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="block sm:inline">{successMessage}</span>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (!file || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {records.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counselor Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.firstName} {record.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.program}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.site}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.counselor_email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 