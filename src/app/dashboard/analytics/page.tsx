'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, subDays, subMonths } from 'date-fns';
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
import { AcademicCapIcon, UserGroupIcon, MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

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
  program: string;
  site: string;
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
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
      <div className="bg-white p-6 rounded-lg shadow mb-10">
        <h3 className="text-lg font-semibold mb-4">Submission Trends (Last 90 Days)</h3>
        <div className="h-80">
          <Line options={lineOptions} data={getTimeSeriesData()} />
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
    </div>
  );
} 