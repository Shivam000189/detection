import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import CrimeTrendChart from "../components/charts/CrimeTrendChart";
import SeverityPieChart from "../components/charts/SeverityPieChart";
import { getCrimeTrends, getCrimeStats } from "../api/crimes";

export default function Analytics() {

  // 🔥 FILTER STATE
  const [filters, setFilters] = useState({
    city: "",
    crimeType: "",
    startDate: "",
    endDate: "",
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const [trendData, setTrendData] = useState([]);
  const [severityData, setSeverityData] = useState([]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 🧠 DEBOUNCE (wait before calling API)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timeout);
  }, [filters]);

  // 📊 FETCH TRENDS (AI)
  useEffect(() => {
    getCrimeTrends(debouncedFilters)
      .then((res) => {
        const trends = res?.data?.data?.trends || [];

        const formatted = trends.map((t) => ({
          month: t.period || t.month,
          crimes: t.totalCrimes || t.count || 0,
        }));

        setTrendData(formatted);
      })
      .catch(() => setTrendData([]));
  }, [debouncedFilters]);

  // 🥧 FETCH STATS (DB)
  useEffect(() => {
    getCrimeStats()
      .then((res) => {
        const stats = res?.data?.data?.bySeverity || {};

        setSeverityData([
          { name: "High", value: stats.high || 0 },
          { name: "Medium", value: stats.medium || 0 },
          { name: "Low", value: stats.low || 0 },
        ]);
      })
      .catch(() => setSeverityData([]));
  }, []);

  // 🔥 AUTO REFRESH
  useEffect(() => {
    const interval = setInterval(() => {
      getCrimeTrends(debouncedFilters)
        .then((res) => {
          const trends = res?.data?.data?.trends || [];

          const formatted = trends.map((t) => ({
            month: t.period || t.month,
            crimes: t.totalCrimes || t.count || 0,
          }));

          setTrendData(formatted);
        });
    }, 10000);

    return () => clearInterval(interval);
  }, [debouncedFilters]);

  return (
    <DashboardLayout title="Analytics">

      {/* 🔥 FILTER UI */}
      <div className="bg-[#111118] p-4 rounded-xl border border-white/10 mb-6 grid md:grid-cols-4 gap-4">

        <input
          placeholder="City (Delhi)"
          className="p-2 bg-black/40 rounded text-white"
          onChange={(e) => handleChange("city", e.target.value)}
        />

        <input
          placeholder="Crime Type (theft, robbery...)"
          className="p-2 bg-black/40 rounded text-white"
          onChange={(e) => handleChange("crimeType", e.target.value)}
        />

        <input
          type="date"
          className="p-2 bg-black/40 rounded text-white"
          onChange={(e) => handleChange("startDate", e.target.value)}
        />

        <input
          type="date"
          className="p-2 bg-black/40 rounded text-white"
          onChange={(e) => handleChange("endDate", e.target.value)}
        />

      </div>

      {/* 📊 TREND */}
      <CrimeTrendChart data={trendData} />

      {/* 🥧 PIE */}
      <div className="mt-6">
        <SeverityPieChart data={severityData} />
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Live updating every 10 seconds...
      </p>

    </DashboardLayout>
  );
}