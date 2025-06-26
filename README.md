# D79 Job Application Form

A comprehensive web application for managing job applications for District 79 (D79) programs. Built with Next.js 15, TypeScript, and MongoDB, this application provides a secure and efficient way to collect, manage, and process student job applications.

## 🚀 Features

### For Applicants
- **Secure Application Form** - Collect comprehensive student information
- **Data Encryption** - Sensitive data (SSN, DOB) is encrypted at rest
- **Work Preferences** - Location and time preference selection
- **Document Verification** - Built-in verification checkboxes
- **Fingerprint Payment Options** - Payment preference selection
- **Duplicate Prevention** - Automatic duplicate detection by email/SSN

### For Administrators
- **Dashboard Management** - Complete application overview and management
- **Bulk Operations** - Bulk status updates and coupon assignments
- **Advanced Filtering** - Filter by status, payment preference, dates, etc.
- **CSV Export** - Download all applications with password protection
- **Coupon Management** - Assign and manage discount coupons
- **Analytics** - Application statistics and insights
- **Individual Record Management** - View, edit, and delete applications

### Security Features
- **Data Encryption** - Sensitive information encrypted using AES-256
- **Password Protection** - Secure download functionality
- **Input Validation** - Comprehensive form validation
- **Duplicate Prevention** - Prevents duplicate applications

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Database**: MongoDB Atlas
- **Authentication**: Environment-based password protection
- **Encryption**: AES-256 encryption for sensitive data
- **Deployment**: Vercel

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB instance)
- npm, yarn, or pnpm package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jjaramillo34/job-application-form.git
   cd job-application-form
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=your_database_name
   DOWNLOAD_PASSWORD=your_secure_download_password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
job-application-form/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── applications/       # Application management APIs
│   │   │   ├── coupons/           # Coupon management APIs
│   │   │   └── bulk-upload/       # Bulk upload functionality
│   │   ├── components/            # React components
│   │   ├── dashboard/             # Admin dashboard pages
│   │   └── lib/                   # Utility libraries
│   └── lib/                       # Shared libraries
├── public/                        # Static assets
└── temp/                          # Temporary files
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `MONGODB_DB` | Database name | Yes |
| `DOWNLOAD_PASSWORD` | Password for CSV downloads | Yes |

### MongoDB Collections

The application uses the following MongoDB collections:
- `applications` - Student job applications
- `coupons` - Discount coupons and assignments

## 📊 Usage

### For Students
1. Navigate to the application form
2. Fill out all required information
3. Select work preferences and payment options
4. Verify all required checkboxes
5. Submit the application

### For Administrators
1. Access the dashboard at `/dashboard`
2. View and manage applications
3. Use bulk operations for efficiency
4. Export data using the download feature
5. Manage coupon assignments

## 🔒 Security

- **Data Encryption**: Sensitive data (SSN, DOB) is encrypted using AES-256
- **Input Validation**: Comprehensive client and server-side validation
- **Duplicate Prevention**: Automatic detection of duplicate applications
- **Password Protection**: Secure download functionality
- **Connection Pooling**: Optimized MongoDB connections

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start the production server: `npm start`

## 📈 Features in Detail

### Application Form
- Personal information collection
- Program and site selection
- Work location preferences (Bronx, Brooklyn, Queens, Staten Island, Manhattan)
- Work time preferences (Morning, Afternoon, Evening, Weekend)
- Document verification checkboxes
- Fingerprint payment preference

### Dashboard Features
- **Application Management**: View, edit, approve, reject, delete applications
- **Bulk Operations**: Update multiple applications at once
- **Advanced Filtering**: Filter by status, payment, dates, counselor email
- **Search Functionality**: Search by name and counselor email
- **Pagination**: Handle large datasets efficiently
- **CSV Export**: Download all data with password protection

### Coupon Management
- **Coupon Assignment**: Assign coupons to accepted students
- **Bulk Assignment**: Automatically assign coupons to multiple students
- **Coupon Tracking**: Monitor coupon usage and assignments
- **Unassignment**: Remove coupon assignments when needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is licensed under a Private Software License Agreement. All rights reserved by Javier Jaramillo and District 79, New York City Department of Education. See the [LICENSE](LICENSE) file for complete terms and conditions.

**Private and Confidential** - This software is the exclusive property of Javier Jaramillo and District 79, NYC Department of Education. Unauthorized use, reproduction, or distribution is strictly prohibited.

## 👥 Support

For support and questions, please contact:
- **Email**: jjaramillo7@schools.nyc.gov
- **Project Maintainer**: Javier Jaramillo

## 🔄 Recent Updates

- ✅ Added delete functionality for applications
- ✅ Improved MongoDB connection handling
- ✅ Enhanced CSV export with individual work preference columns
- ✅ Added bulk delete operations
- ✅ Improved error handling and notifications
- ✅ Application form closed as of Tuesday, June 24

## 📊 Status

- **Application Form**: Closed (as of Tuesday, June 24)
- **Dashboard**: Active and fully functional
- **Data Management**: Operational
- **Security**: All features implemented and tested

---

**Built with ❤️ for District 79**
