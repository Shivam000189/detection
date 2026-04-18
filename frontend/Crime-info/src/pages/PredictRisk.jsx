import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import AISummaryBox from "../components/ui/AISummaryBox";
import api from "../api/axios";

export default function PredictRisk() {
  const [form, setForm] = useState({
    location: "",
    time: "",
    victim_age: "",
    victim_gender: "Male",
    weapon_used: "",
    crime_domain: "",
    police_deployed: 0,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const predict = async () => {
    if (!form.location || !form.time) {
      setError("Location and Time are required");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      // ✅ Goes through backend proxy — no hardcoded AI model URL
      const res = await api.post("/crimes/predict", form);
      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Prediction failed. Make sure AI model service is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Predict Risk">
      <div className="grid lg:grid-cols-2 gap-6">

        {/* 🧾 FORM */}
        <div className="p-6 bg-[#111118] rounded-xl border border-white/10 space-y-3">

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Location *</label>
            <input
              placeholder="e.g. Delhi, Connaught Place"
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Time *</label>
            <input
              type="time"
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.time}
              onChange={(e) => handleChange("time", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Victim Age</label>
            <input
              type="number"
              placeholder="e.g. 25"
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.victim_age}
              onChange={(e) => handleChange("victim_age", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Victim Gender</label>
            <select
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.victim_gender}
              onChange={(e) => handleChange("victim_gender", e.target.value)}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Weapon Used</label>
            <input
              placeholder="e.g. Knife, None"
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.weapon_used}
              onChange={(e) => handleChange("weapon_used", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Crime Domain</label>
            <input
              placeholder="e.g. Street, Home, Vehicle"
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.crime_domain}
              onChange={(e) => handleChange("crime_domain", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Police Deployed</label>
            <input
              type="number"
              placeholder="0"
              className="w-full p-2.5 bg-black/40 rounded-lg text-white border border-white/10 focus:border-purple-500 outline-none"
              value={form.police_deployed}
              onChange={(e) => handleChange("police_deployed", Number(e.target.value))}
            />
          </div>

          <button
            onClick={predict}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-lg w-full font-medium transition-colors"
          >
            {loading ? "Analyzing..." : "Predict Risk"}
          </button>
        </div>

        {/* ⏳ LOADING */}
        {loading && (
          <AISummaryBox title="Analyzing Crime Risk..." loading />
        )}

        {/* ✅ RESULT */}
        {result && !loading && (
          <div className="p-6 bg-[#111118] rounded-xl border border-white/10 text-white space-y-3">

            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold capitalize">
                {result?.predicted_crime}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                result.risk_level === "HIGH"
                  ? "bg-red-500/20 text-red-400"
                  : result.risk_level === "MEDIUM"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-green-500/20 text-green-400"
              }`}>
                {result.risk_level}
              </span>
            </div>

            <div className="p-3 bg-black/30 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(result.probability || 0) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 tabular-nums">
                  {((result.probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {result.recommendation && (
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400 font-medium mb-1">Recommendation</p>
                <p className="text-sm text-gray-300">{result.recommendation}</p>
              </div>
            )}

            {result.aiSummary && (
              <AISummaryBox
                title="AI Insight"
                content={result.aiSummary}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}