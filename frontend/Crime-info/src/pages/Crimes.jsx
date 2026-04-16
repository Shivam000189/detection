import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { getCrimes } from "../api/crimes";
import Badge from "../components/ui/Badge";
import { getCrimeHotspots } from "../api/crimes";
import { getCrimeAreaRisk } from "../api/crimes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Crimes() {
  const [crimes, setCrimes] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [hotspots, setHotspots] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    const params = {};

    // ✅ If no location → show latest 10
    if (!selectedLocation) {
      params.limit = 10;
    } else {
      params.location = selectedLocation;
    }

    getCrimes(params)
      .then((res) => {
        const data = res?.data?.data || [];
        console.log("CRIMES:", data);
        setCrimes(data);
      })
      .catch((err) => {
        console.error(err);
        setCrimes([]);
      });
  }, [selectedLocation]);

  useEffect(() => {
      if (!selectedLocation) {
        setHotspots([]); // ✅ clear old data
        return;
      }

      getCrimeHotspots({ city: selectedLocation })
        .then((res) => {
          setHotspots(res?.data?.hotspots || []);
        })
        .catch(() => setHotspots([]));
    }, [selectedLocation]);

    useEffect(() => {
      if (!selectedLocation) {
        setRiskData(null);     // ✅ clear
        setTrendData([]);      // ✅ clear
        return;
      }

      getCrimeAreaRisk({ city: selectedLocation })
        .then((res) => {
          const data = res.data;
          setRiskData(data);
          setTrendData(data.monthlyTrend || []);
        })
        .catch(() => {
          setRiskData(null);
          setTrendData([]);
        });
    }, [selectedLocation]);

  return (
    <DashboardLayout title="Crimes">

      {/* 📍 Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by location (e.g. Delhi, Mall)"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="bg-[#111118] text-white p-2 rounded border border-white/10 w-full max-w-md"
        />
      </div>

      {/* 📋 Table */}
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Severity</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Location</th>
            <th className="text-left p-2">Camera</th>
          </tr>
        </thead>

        <tbody>
          {crimes.map((c) => (
            <tr key={c._id} className="border-t border-white/10">
              <td className="p-2">{c.crimeType}</td>

              <td className="p-2">
                <Badge variant="danger">{c.severity}</Badge>
              </td>

              <td className="p-2">
                {c.isSaved ? "Saved" : "New"}
              </td>

              <td className="p-2 text-gray-400">
                {c.location}
              </td>

              <td className="p-2 text-gray-400">
                {c.cameraId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLocation && (
        <div className="mt-8">
          <h3 className="text-white font-semibold mb-3">
            🔥 AI Hotspots
          </h3>

          {hotspots.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No hotspot data
            </p>
          ) : (
            hotspots.map((h, i) => (
              <div
                key={i}
                className="p-3 bg-[#1a1a24] rounded mb-2 border border-white/10"
              >
                <p className="text-white">{h.area}</p>
                <p className="text-gray-400 text-sm">
                  Crime: {h.mostCommonCrime}
                </p>
                <p className="text-gray-400 text-sm">
                  Risk: {h.riskLevel}
                </p>
                <p className="text-gray-400 text-sm">
                  Peak Time: {h.peakTime}
                </p>
              </div>
            ))
          )}
        </div>
      )}


      {/* ⚠ AREA RISK */}
      {riskData && (
        <div className="mt-8">
          <h3 className="text-white font-semibold mb-3">
            ⚠ Area Risk Score
          </h3>

          <div className="bg-[#1a1a24] p-4 rounded border border-white/10">
            
            {/* Score */}
            <p className="text-white text-lg mb-2">
              Risk Level: {riskData.riskLevel}
            </p>

            {/* Bar */}
            <div className="w-full bg-gray-700 h-4 rounded">
              <div
                className="h-4 rounded bg-red-500"
                style={{
                  width: `${riskData.riskScore * 10}%`,
                }}
              />
            </div>

            <p className="text-gray-400 text-sm mt-2">
              Score: {riskData.riskScore}/10
            </p>
          </div>
        </div>
      )}


      {/* 📊 CRIME TREND CHART */}
      {trendData.length > 0 && (
        <div className="mt-10">
          <h3 className="text-white font-semibold mb-4">
            📊 Crime Trend (Monthly)
          </h3>

          <div className="bg-[#1a1a24] p-4 rounded border border-white/10">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalCrimes"
                  stroke="#a855f7"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Empty state */}
      {crimes.length === 0 && selectedLocation && (
        <p className="text-gray-400 mt-4">
          No crimes found for this location
        </p>
      )}

    </DashboardLayout>
  );
}