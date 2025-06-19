import DashboardLayout from '@/components/layout/DashboardLayout';
import { FiActivity, FiUsers, FiTrendingUp, FiClock } from 'react-icons/fi';

export default function DashboardPage() {
  // Mock data - replace with real data from your API
  const stats = [
    { name: 'Active Participants', value: '24', icon: <FiUsers className="h-6 w-6" />, change: '+12%', changeType: 'increase' },
    { name: 'Sessions Today', value: '45', icon: <FiActivity className="h-6 w-6" />, change: '+5%', changeType: 'increase' },
    { name: 'Avg. Session Duration', value: '12:34', icon: <FiClock className="h-6 w-6" />, change: '+2%', changeType: 'increase' },
    { name: 'Risk Level', value: 'Medium', icon: <FiTrendingUp className="h-6 w-6" />, change: '-3%', changeType: 'decrease' },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, Researcher</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your mental health assessment program today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`mt-1 text-sm ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last week
                  </p>
                </div>
                <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity and Risk Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-800">View All</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm mr-4">
                    {String.fromCharCode(64 + i)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Participant {i} completed a session</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Low Risk</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Medium Risk</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">High Risk</span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <h3 className="text-sm font-medium text-indigo-800">Recommendation</h3>
              <p className="text-sm text-indigo-700 mt-1">Schedule follow-up with 3 high-risk participants this week.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
