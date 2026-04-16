import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getProfileApi } from "../api/auth";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getProfileApi()
      .then((res) => setUser(res?.data?.data))
      .catch(() => setUser(null));
  }, []);

  if (!user) {
    return (
      <DashboardLayout title="Profile">
        <p className="text-gray-400">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">

      <div className="px-6 py-8 text-white">

        {/* 👤 HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-lg font-semibold">
              {user.name?.charAt(0)}
            </div>

            <div>
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="text-sm px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition"
          >
            Logout
          </button>
        </div>

        {/* 📄 INFO GRID */}
        <div className="grid md:grid-cols-3 gap-6 mt-8 text-sm">

          <div>
            <p className="text-gray-500">Role</p>
            <p className="mt-1 text-white font-medium">{user.role}</p>
          </div>

          <div>
            <p className="text-gray-500">User ID</p>
            <p className="mt-1 text-white font-medium">{user.userId}</p>
          </div>

          <div>
            <p className="text-gray-500">Last Login</p>
            <p className="mt-1 text-white font-medium">
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleString()
                : "—"}
            </p>
          </div>

        </div>

        {/* ✏️ ACTION */}
        {/* <div className="mt-10">
          <button className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded transition text-sm">
            Edit Profile
          </button>
        </div> */}

      </div>

    </DashboardLayout>
  );
}