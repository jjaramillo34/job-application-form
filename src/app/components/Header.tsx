'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Upload } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image
              src="/images/d79logo-removebg.png"
              alt="D79 Logo"
              width={100}
              height={50}
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            <Image
              src="/images/nycpublicshools-removebg.png"
              alt="NYC Public Schools Logo"
              width={100}
              height={60}
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
          <Link 
            href="/bulk-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Link>
        </div>
      </div>
    </header>
  );
} 