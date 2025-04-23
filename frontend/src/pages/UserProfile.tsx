import React, { useState } from 'react';

interface UserProfileProps {
  
}

interface UserActivity {
  date: string;
  title: string;
  description: string;
}

const UserProfile: React.FC<UserProfileProps> = () => {
  
  const [userData, setUserData] = useState({
    name: 'Anuri Kumar',
    email: 'anuri.kumar@gmail.com',
    phone: '+91 98765 43210',
    language: 'en',
    timezone: 'ist',
    dateFormat: 'dmy',
  });

  
  const [activities] = useState<UserActivity[]>([
    {
      date: 'April 23, 2025 - 18:45',
      title: 'Login from new device',
      description: 'Mobile - Chrome - Mumbai, India',
    },
    {
      date: 'April 21, 2025 - 10:30',
      title: 'Password changed',
      description: 'Password successfully updated',
    },
    {
      date: 'April 19, 2025 - 14:15',
      title: 'Profile information updated',
      description: 'Email address updated',
    },
  ]);

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setUserData({ ...userData, [id]: value });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('User data saved:', userData);
    // Add API call to save user data here
  };

  return (
    <div className="bg-[#f2f7fa] min-h-screen text-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="#" className="flex items-center text-[#4f99ba] font-bold text-2xl">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            NeoPOS
          </a>
          <nav className="flex gap-6">
            <a href="#" className="text-gray-600 font-medium hover:text-[#4f99ba]">
              Dashboard
            </a>
            <a
              href="#"
              className="text-[#4f99ba] font-medium border-b-2 border-[#4f99ba]"
            >
              Profile
            </a>
            <a href="#" className="text-[#4f99ba] font-medium">
              Logout
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-36 h-36 rounded-full bg-[#4f99ba] text-white flex items-center justify-center mx-auto mb-6">
              <svg
                width="70"
                height="70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {userData.name}
            </h2>
            <p className="text-gray-500 mb-6">User ID: #1234</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#4f99ba]">42</div>
                <div className="text-gray-500 text-sm">Transactions</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#4f99ba]">9</div>
                <div className="text-gray-500 text-sm">Months Active</div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <button
                className="w-full bg-[#4f99ba] hover:bg-[#3d7a95] text-white py-2 px-4 rounded transition duration-300"
                type="button"
              >
                Change Password
              </button>
              <button
                className="w-full bg-[#4f99ba] hover:bg-[#3d7a95] text-white py-2 px-4 rounded transition duration-300"
                type="button"
              >
                Manage Notifications
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block mb-2 font-medium text-gray-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={userData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 font-medium text-gray-600">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={userData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block mb-2 font-medium text-gray-600">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={userData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label htmlFor="language" className="block mb-2 font-medium text-gray-600">
                      Preferred Language
                    </label>
                    <select
                      id="language"
                      value={userData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* System Preferences */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  System Preferences
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="timezone" className="block mb-2 font-medium text-gray-600">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={userData.timezone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-md"
                    >
                      <option value="ist">Indian Standard Time (UTC+5:30)</option>
                      <option value="pst">Pacific Time (UTC-8)</option>
                      <option value="est">Eastern Time (UTC-5)</option>
                      <option value="gmt">Greenwich Mean Time (UTC+0)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dateFormat" className="block mb-2 font-medium text-gray-600">
                      Date Format
                    </label>
                    <select
                      id="dateFormat"
                      value={userData.dateFormat}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-md"
                    >
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="ymd">YYYY/MM/DD</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Recent Activity
                </h3>
                <div className="space-y-0">
                  {activities.map((activity, index) => (
                    <div
                      key={index}
                      className="py-4 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm text-gray-400">{activity.date}</p>
                      <h4 className="font-medium my-1">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <button
                type="submit"
                className="bg-[#4f99ba] hover:bg-[#3d7a95] text-white py-3 px-6 rounded transition duration-300"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;