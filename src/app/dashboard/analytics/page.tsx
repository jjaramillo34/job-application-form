'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, subDays, getDay, getHours } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { AcademicCapIcon, UserGroupIcon, MapPinIcon, ExclamationTriangleIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  counselor_email: string;
  phone: string;
  program: string;
  site: string;
  lcgmsCode: string;
  geographicDistrict: string;
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
  fingerprintPaymentPreference: 'yes' | 'no' | 'pending';
  status: 'pending' | 'approved' | 'rejected' | 'accepted';
  submittedAt: string;
  statusUpdatedAt?: string;
}

const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  purple: '#8884d8',
  green: '#82ca9d',
  yellow: '#ffc658',
  orange: '#ff8042',
  blue: '#0088FE',
};

const COLOR_ARRAY = Object.values(COLORS);

export default function Analytics() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data.applications);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const counselorStats = applications.reduce((acc: { [key: string]: number }, app) => {
    acc[app.counselor_email] = (acc[app.counselor_email] || 0) + 1;
    return acc;
  }, {});

  const programStats = applications.reduce((acc: { [key: string]: number }, app) => {
    acc[app.program] = (acc[app.program] || 0) + 1;
    return acc;
  }, {});

  const districtStats = applications.reduce((acc: { [key: string]: number }, app) => {
    acc[app.geographicDistrict] = (acc[app.geographicDistrict] || 0) + 1;
    return acc;
  }, {});

  const statusStats = applications.reduce((acc: { [key: string]: number }, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const paymentStats = applications.reduce((acc: { [key: string]: number }, app) => {
    acc[app.fingerprintPaymentPreference] = (acc[app.fingerprintPaymentPreference] || 0) + 1;
    return acc;
  }, {});

  const workLocationStats = applications.reduce((acc: { [key: string]: number }, app) => {
    Object.entries(app.workPreferences).forEach(([location, selected]) => {
      if (selected) {
        acc[location] = (acc[location] || 0) + 1;
      }
    });
    return acc;
  }, {});

  // Prepare data for charts
  const counselorData = Object.entries(counselorStats)
    .map(([name, count]) => ({
      counselor: name.split('@')[0],
      submissions: count
    }))
    .sort((a, b) => b.submissions - a.submissions)
    .slice(0, 10);

  const programData = Object.entries(programStats)
    .map(([name, count]) => ({
      program: name,
      applications: count
    }))
    .sort((a, b) => b.applications - a.applications);

  const statusData = Object.entries(statusStats)
    .map(([name, value]) => ({
      status: name.charAt(0).toUpperCase() + name.slice(1),
      count: value
    }));

  const paymentData = Object.entries(paymentStats)
    .map(([name, value]) => ({
      preference: name === 'yes' ? 'Willing to Pay' : name === 'no' ? 'Not Willing' : 'Pending',
      count: value
    }));

  const workLocationData = Object.entries(workLocationStats)
    .filter(([key]) => ['bronx', 'brooklyn', 'queens', 'statenIsland', 'manhattan'].includes(key))
    .map(([name, value]) => ({
      location: name.charAt(0).toUpperCase() + name.slice(1),
      count: value
    }));

  // Time series data with 90 days
  const getTimeSeriesData = () => {
    const last90Days = eachDayOfInterval({
      start: subDays(new Date(), 89),
      end: new Date(),
    });

    const dailySubmissions = last90Days.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      const dayApps = applications.filter(app => {
        const submissionDate = parseISO(app.submittedAt);
        return submissionDate >= dayStart && submissionDate <= dayEnd;
      });
      
      return {
        date: format(dayStart, 'MMM dd'),
        count: dayApps.length,
        approved: dayApps.filter(app => app.status === 'approved' || app.status === 'accepted').length,
      };
    });

    return {
      labels: dailySubmissions.map(d => d.date),
      datasets: [
        {
          label: 'Total Submissions',
          data: dailySubmissions.map(d => d.count),
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Approved Applications',
          data: dailySubmissions.map(d => d.approved),
          borderColor: COLORS.success,
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ],
    };
  };

  // Work Preference Correlation: For each location, show the percentage of applicants who selected each time slot (Morning, Afternoon, Evening, Weekend) out of all applicants who selected that location.
  const getWorkPreferenceCorrelation = () => {
    const preferences = ['morning', 'afternoon', 'evening', 'weekend'];
    const locations = ['bronx', 'brooklyn', 'queens', 'statenIsland', 'manhattan'];

    // For each location, count total applicants who selected that location
    const locationTotals: Record<string, number> = {};
    locations.forEach(loc => {
      locationTotals[loc] = applications.filter(app => app.workPreferences[loc as keyof typeof app.workPreferences]).length;
    });

    // For each time slot, for each location, count applicants who selected both
    const dataByPreference: Record<string, number[]> = {};
    preferences.forEach(pref => {
      dataByPreference[pref] = locations.map(loc => {
        const count = applications.filter(app =>
          app.workPreferences[loc as keyof typeof app.workPreferences] &&
          app.workPreferences[pref as keyof typeof app.workPreferences]
        ).length;
        // Percentage of applicants who selected both, out of all who selected the location
        return locationTotals[loc] > 0 ? (count / locationTotals[loc]) * 100 : 0;
      });
    });

    return {
      labels: locations.map(loc => loc.charAt(0).toUpperCase() + loc.slice(1)),
      datasets: preferences.map((pref, index) => ({
        label: pref.charAt(0).toUpperCase() + pref.slice(1),
        data: dataByPreference[pref],
        backgroundColor: COLOR_ARRAY[index % COLOR_ARRAY.length],
      })),
    };
  };

  // Enhanced program success rates with more metrics
  const getProgramSuccessRates = () => {
    const programStats = applications.reduce((acc: { 
      [key: string]: { 
        total: number; 
        approved: number;
        verified: number;
        pending: number;
      } 
    }, app) => {
      if (!acc[app.program]) {
        acc[app.program] = { total: 0, approved: 0, verified: 0, pending: 0 };
      }
      acc[app.program].total++;
      if (app.status === 'approved' || app.status === 'accepted') {
        acc[app.program].approved++;
      }
      if (app.documentsVerified && app.attendanceVerified) {
        acc[app.program].verified++;
      }
      if (app.status === 'pending') {
        acc[app.program].pending++;
      }
      return acc;
    }, {});

    const successRates = Object.entries(programStats)
      .map(([program, stats]) => ({
        program,
        successRate: (stats.approved / stats.total) * 100,
        verificationRate: (stats.verified / stats.total) * 100,
        pendingRate: (stats.pending / stats.total) * 100,
        total: stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    return {
      labels: successRates.map(d => d.program),
      datasets: [
        {
          label: 'Success Rate (%)',
          data: successRates.map(d => d.successRate),
          backgroundColor: COLORS.success,
        },
        {
          label: 'Verification Rate (%)',
          data: successRates.map(d => d.verificationRate),
          backgroundColor: COLORS.info,
        },
        {
          label: 'Pending Rate (%)',
          data: successRates.map(d => d.pendingRate),
          backgroundColor: COLORS.warning,
        }
      ],
    };
  };

  // --- Key Insights Computation ---
  // Top Program by Success Rate
  const programSuccessRates = (() => {
    const programStats = applications.reduce((acc: { [key: string]: { total: number; approved: number } }, app) => {
      if (!acc[app.program]) acc[app.program] = { total: 0, approved: 0 };
      acc[app.program].total++;
      if (app.status === 'approved' || app.status === 'accepted') acc[app.program].approved++;
      return acc;
    }, {});
    return Object.entries(programStats)
      .map(([program, stats]) => ({
        program,
        rate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
        total: stats.total,
      }))
      .sort((a, b) => b.rate - a.rate);
  })();
  const topProgram = programSuccessRates[0]?.program || 'N/A';
  const topProgramRate = programSuccessRates[0]?.rate?.toFixed(1) || '0';

  // Top Counselor by Submissions
  const counselorCounts = Object.entries(counselorStats).map(([c, count]) => ({ c, count }));
  const topCounselor = counselorCounts.sort((a, b) => b.count - a.count)[0]?.c?.split('@')[0] || 'N/A';
  const topCounselorCount = counselorCounts.sort((a, b) => b.count - a.count)[0]?.count || 0;

  // Most Common Work Location
  const locationCounts = Object.entries(workLocationStats).map(([loc, count]) => ({ loc, count }));
  const topLocation = locationCounts.sort((a, b) => b.count - a.count)[0]?.loc || 'N/A';
  const topLocationCount = locationCounts.sort((a, b) => b.count - a.count)[0]?.count || 0;

  // Outlier: Program with 0% success
  const outlierProgram = programSuccessRates.find(p => p.rate === 0 && p.total > 0)?.program || null;

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '90-Day Submission Trends',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' applications';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Applications'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
  };

  const correlationOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Work Preference Correlations by Percentage',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Location'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Percentage of Applicants'
        },
        ticks: {
          callback: function(this: any, value: number | string) {
            return `${value}%`;
          }
        }
      },
    },
  };

  const successRateOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Program Performance Metrics',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage'
        },
        ticks: {
          callback: function(this: any, value: number | string) {
            return `${value}%`;
          }
        },
      },
      x: {
        title: {
          display: true,
          text: 'Program'
        }
      }
    },
  };

  // Chart data
  const counselorChartData = {
    labels: counselorData.map(d => d.counselor),
    datasets: [{
      label: 'Submissions',
      data: counselorData.map(d => d.submissions),
      backgroundColor: '#8884d8',
    }],
  };

  const programChartData = {
    labels: programData.map(d => d.program),
    datasets: [{
      label: 'Applications',
      data: programData.map(d => d.applications),
      backgroundColor: '#82ca9d',
    }],
  };

  const statusChartData = {
    labels: statusData.map(d => d.status),
    datasets: [{
      data: statusData.map(d => d.count),
      backgroundColor: COLOR_ARRAY,
    }],
  };

  const paymentChartData = {
    labels: paymentData.map(d => d.preference),
    datasets: [{
      data: paymentData.map(d => d.count),
      backgroundColor: COLOR_ARRAY,
    }],
  };

  const workLocationChartData = {
    labels: workLocationData.map(d => d.location),
    datasets: [{
      label: 'Preferences',
      data: workLocationData.map(d => d.count),
      backgroundColor: '#ffc658',
    }],
  };

  // LCGMS Code Distribution (top 10)
  const lcgmsStats = applications.reduce((acc: { [key: string]: number }, app) => {
    acc[app.lcgmsCode] = (acc[app.lcgmsCode] || 0) + 1;
    return acc;
  }, {});
  const lcgmsData = Object.entries(lcgmsStats)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // LCGMS Code Success Rate (top 10 by volume)
  const lcgmsSuccessStats = applications.reduce((acc: { [key: string]: { total: number; approved: number } }, app) => {
    if (!acc[app.lcgmsCode]) acc[app.lcgmsCode] = { total: 0, approved: 0 };
    acc[app.lcgmsCode].total++;
    if (app.status === 'approved' || app.status === 'accepted') acc[app.lcgmsCode].approved++;
    return acc;
  }, {});
  const lcgmsSuccessData = Object.entries(lcgmsSuccessStats)
    .map(([code, stats]) => ({
      code,
      successRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
      total: stats.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const lcgmsChartData = {
    labels: lcgmsData.map(d => d.code),
    datasets: [{
      label: 'Applications',
      data: lcgmsData.map(d => d.count),
      backgroundColor: '#7c3aed',
    }],
  };

  const lcgmsSuccessChartData = {
    labels: lcgmsSuccessData.map(d => d.code),
    datasets: [{
      label: 'Success Rate (%)',
      data: lcgmsSuccessData.map(d => d.successRate),
      backgroundColor: '#059669',
    }],
  };

  const lcgmsBarOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Applications by LCGMS Code' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Applications' } },
      x: { title: { display: true, text: 'LCGMS Code' } },
    },
  };

  const lcgmsSuccessBarOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Success Rate by LCGMS Code' },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Success Rate (%)' },
        ticks: {
          callback: function(this: any, value: number | string) {
            return `${value}%`;
          }
        }
      },
      x: { title: { display: true, text: 'LCGMS Code' } },
    },
  };

  // Quick stats
  const totalApplications = applications.length;
  const approvedApplications = applications.filter(app => app.status === 'approved').length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
  const verifiedDocuments = applications.filter(app => app.documentsVerified).length;
  const verifiedAttendance = applications.filter(app => app.attendanceVerified).length;
  const completedQuestionnaire = applications.filter(app => app.fingerprintQuestionnaire).length;
  const willingToPay = applications.filter(app => app.fingerprintPaymentPreference === 'yes').length;
  const notWillingToPay = applications.filter(app => app.fingerprintPaymentPreference === 'no').length;
  const pendingPayment = applications.filter(app => app.fingerprintPaymentPreference === 'pending').length;

  // Calculate average response time (time between submission and status change)
  const getAverageResponseTime = () => {
    const responseTimes = applications
      .filter(app => app.status !== 'pending')
      .map(app => {
        const submissionDate = new Date(app.submittedAt);
        const statusChangeDate = new Date(app.statusUpdatedAt || app.submittedAt);
        return (statusChangeDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60); // in hours
      });
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  };

  // Prepare heatmap data
  const getHeatmapData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    const heatmapData = days.map(day => {
      const dayIndex = days.indexOf(day);
      return hours.map(hour => {
        const count = applications.filter(app => {
          const date = new Date(app.submittedAt);
          return getDay(date) === dayIndex && getHours(date) === hour;
        }).length;
        return {
          day,
          hour,
          count
        };
      });
    });

    return heatmapData;
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Top Section: Work Location Preferences & Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Work Location Preferences Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Work Location Preferences</h3>
          <div className="h-80">
            <Bar options={barOptions} data={workLocationChartData} />
          </div>
        </div>
        {/* Summary Statistics Card */}
        <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="text-sm font-medium text-blue-800">Total Applications</h4>
              <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h4 className="text-sm font-medium text-green-800">Unique Counselors</h4>
              <p className="text-2xl font-bold text-green-600">{Object.keys(counselorStats).length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h4 className="text-sm font-medium text-purple-800">Unique Programs</h4>
              <p className="text-2xl font-bold text-purple-600">{Object.keys(programStats).length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <h4 className="text-sm font-medium text-yellow-800">Unique Districts</h4>
              <p className="text-2xl font-bold text-yellow-600">{Object.keys(districtStats).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Status Distribution</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="text-sm font-medium text-green-600">{approvedApplications}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Accepted</span>
              <span className="text-sm font-medium text-blue-600">{acceptedApplications}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-yellow-600">{pendingApplications}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="text-sm font-medium text-red-600">{rejectedApplications}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Documents Verified</span>
              <span className="text-sm font-medium text-green-600">{verifiedDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Attendance Verified</span>
              <span className="text-sm font-medium text-blue-600">{verifiedAttendance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Questionnaire Completed</span>
              <span className="text-sm font-medium text-purple-600">{completedQuestionnaire}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Payment Preferences</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Willing to Pay</span>
              <span className="text-sm font-medium text-green-600">{willingToPay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Not Willing</span>
              <span className="text-sm font-medium text-red-600">{notWillingToPay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Decision</span>
              <span className="text-sm font-medium text-yellow-600">{pendingPayment}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Unique Counts</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Counselors</span>
              <span className="text-sm font-medium text-blue-600">{Object.keys(counselorStats).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Programs</span>
              <span className="text-sm font-medium text-purple-600">{Object.keys(programStats).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Districts</span>
              <span className="text-sm font-medium text-green-600">{Object.keys(districtStats).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Counselors by Submissions (Vertical Heatmap) */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Top Counselors by Submissions</h3>
        {/* Color Legend */}
        <div className="flex items-center mb-4">
          <span className="text-xs text-gray-500 mr-2">Low</span>
          <div className="flex-1 h-3 bg-gradient-to-r from-blue-100 via-blue-400 to-blue-900 rounded"></div>
          <span className="text-xs text-gray-500 ml-2">High</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[300px] w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-2">Counselor</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-2">Submissions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Get top 10 counselors
                const topCounselors = counselorData.slice(0, 10);
                // Find min and max for color scaling
                const counts = topCounselors.map(d => d.submissions);
                const min = Math.min(...counts);
                const max = Math.max(...counts);
                // Helper to get color
                const getColor = (count: number) => {
                  if (max === min) return 'bg-blue-400';
                  // Interpolate between blue-100 and blue-900
                  const percent = (count - min) / (max - min);
                  if (percent < 0.2) return 'bg-blue-100';
                  if (percent < 0.4) return 'bg-blue-300';
                  if (percent < 0.6) return 'bg-blue-500';
                  if (percent < 0.8) return 'bg-blue-700';
                  return 'bg-blue-900 text-white';
                };
                return topCounselors.map((d, i) => (
                  <tr key={d.counselor}>
                    <td className="p-2 text-sm text-gray-700">{d.counselor}</td>
                    <td className={`p-2 text-center font-bold rounded ${getColor(d.submissions)}`}>{d.submissions}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-10 flex flex-col md:flex-row gap-6 items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          <div>
            <div className="text-xs text-blue-800 font-semibold uppercase">Top Program</div>
            <div className="text-lg font-bold text-blue-900">{topProgram} <span className="text-sm font-normal text-blue-700">({topProgramRate}% success)</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-8 w-8 text-purple-600" />
          <div>
            <div className="text-xs text-purple-800 font-semibold uppercase">Top Counselor</div>
            <div className="text-lg font-bold text-purple-900">{topCounselor} <span className="text-sm font-normal text-purple-700">({topCounselorCount} apps)</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPinIcon className="h-8 w-8 text-green-600" />
          <div>
            <div className="text-xs text-green-800 font-semibold uppercase">Top Location</div>
            <div className="text-lg font-bold text-green-900">{topLocation.charAt(0).toUpperCase() + topLocation.slice(1)} <span className="text-sm font-normal text-green-700">({topLocationCount} prefs)</span></div>
          </div>
        </div>
        {outlierProgram && (
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-xs text-red-800 font-semibold uppercase">Outlier</div>
              <div className="text-lg font-bold text-red-900">{outlierProgram} <span className="text-sm font-normal text-red-700">(0% success)</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Section: Trends */}
      <h2 className="text-xl font-bold mb-4 mt-8">Trends</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Submission Trends (Last 90 Days)</h3>
          <div className="h-80">
            <Line options={lineOptions} data={getTimeSeriesData()} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total Applications</span>
              <span className="text-2xl font-bold text-blue-600">{totalApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Approved</span>
              <span className="text-2xl font-bold text-green-600">{approvedApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Pending</span>
              <span className="text-2xl font-bold text-yellow-600">{pendingApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Rejected</span>
              <span className="text-2xl font-bold text-red-600">{rejectedApplications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Accepted</span>
              <span className="text-2xl font-bold text-purple-600">{acceptedApplications}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Correlations & Performance */}
      <h2 className="text-xl font-bold mb-4 mt-8">Correlations & Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Work Preference Correlations by Percentage</h3>
          <div className="h-80">
            <Bar options={correlationOptions} data={getWorkPreferenceCorrelation()} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Program Performance Metrics</h3>
          <div className="h-80">
            <Bar options={successRateOptions} data={getProgramSuccessRates()} />
          </div>
        </div>
      </div>

      {/* Section: Distribution */}
      <h2 className="text-xl font-bold mb-4 mt-8">Distribution</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 Counselors by Submissions</h3>
          <div className="h-80">
            <Bar options={barOptions} data={counselorChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Program Distribution</h3>
          <div className="h-80">
            <Bar options={barOptions} data={programChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Application Status Distribution</h3>
          <div className="h-80">
            <Pie options={pieOptions} data={statusChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Fingerprint Payment Preference</h3>
          <div className="h-80">
            <Pie options={pieOptions} data={paymentChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Work Location Preferences</h3>
          <div className="h-80">
            <Bar options={barOptions} data={workLocationChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="text-sm font-medium text-blue-800">Total Applications</h4>
                <p className="text-2xl font-bold text-blue-600">{applications.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="text-sm font-medium text-green-800">Unique Counselors</h4>
                <p className="text-2xl font-bold text-green-600">{Object.keys(counselorStats).length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="text-sm font-medium text-purple-800">Unique Programs</h4>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(programStats).length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <h4 className="text-sm font-medium text-yellow-800">Unique Districts</h4>
                <p className="text-2xl font-bold text-yellow-600">{Object.keys(districtStats).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: LCGMS Code Analysis */}
      <h2 className="text-xl font-bold mb-4 mt-8">LCGMS Code Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Applications by LCGMS Code (Top 10)</h3>
          <div className="h-80">
            <Bar options={lcgmsBarOptions} data={lcgmsChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Success Rate by LCGMS Code (Top 10 by Volume)</h3>
          <div className="h-80">
            <Bar options={lcgmsSuccessBarOptions} data={lcgmsSuccessChartData} />
          </div>
        </div>
      </div>
      
      {/* Section: Button back to the dashboard page */}
    <div className='flex justify-center mt-10'>
      <Link
        href="/dashboard"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow"
      >
        <ArrowLeftIcon className="h-5 w-5 ml-2" />
        &nbsp;&nbsp;
        <span> Back to Dashboard</span>
        &nbsp;&nbsp;
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </Link>
    </div>
    </div>
    
  );
} 