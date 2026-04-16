import { useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import AISummaryBox from "../components/ui/AISummaryBox";
import axios from "axios";

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

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const predict = async () => {
    if (!form.location || !form.time) {
      return alert("Location and Time are required");
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "http://localhost:5001/predict-crime",
        form
      );

      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Predict Risk">
      <div className="grid lg:grid-cols-2 gap-6">

        {/* 🧾 FORM */}
        <div className="p-6 bg-[#111118] rounded-xl border border-white/10">

          <input
            placeholder="Location (e.g. Delhi)"
            className="w-full mb-3 p-2 bg-black/40 rounded text-white"
            onChange={(e) => handleChange("location", e.target.value)}
          />

          <input
            type="time"
            className="w-full mb-3 p-2 bg-black/40 rounded text-white"
            onChange={(e) => handleChange("time", e.target.value)}
          />

          <input
            type="number"
            placeholder="Victim Age"
            className="w-full mb-3 p-2 bg-black/40 rounded text-white"
            onChange={(e) => handleChange("victim_age", Number(e.target.value))}
          />

          <select
            className="w-full mb-3 p-2 bg-black/40 rounded text-white"
            onChange={(e) => handleChange("victim_gender", e.target.value)}
          >
            <option>Male</option>
            <option>Female</option>
          </select>

          <input
            placeholder="Weapon Used"
            className="w-full mb-3 p-2 bg-black/40 rounded text-white"
            onChange={(e) => handleChange("weapon_used", e.target.value)}
          />

          <input
            placeholder="Crime Domain (e.g. Street, Home)"
            className="w-full mb-3 p-2 bg-black/40 rounded text-white"
            onChange={(e) => handleChange("crime_domain", e.target.value)}
          />

          <input
            type="number"
            placeholder="Police Deployed"
            className="w-full mb-4 p-2 bg-black/40 rounded text-white"
            onChange={(e) =>
              handleChange("police_deployed", Number(e.target.value))
            }
          />

          <button
            onClick={predict}
            className="bg-purple-600 px-4 py-2 rounded w-full"
          >
            Predict Risk
          </button>
        </div>

        {/* ⏳ LOADING */}
        {loading && (
          <AISummaryBox title="Analyzing Crime Risk..." loading />
        )}

        {/* ✅ RESULT */}
        {result && (
          <div className="p-6 bg-[#111118] rounded-xl border border-white/10 text-white">

            <p className="text-xl font-semibold mb-2">
              {result?.predicted_crime}
            </p>

            <p className="text-gray-400">
              Risk Level: {result.risk_level}
            </p>

            <p className="text-gray-400">
              Confidence: {result.probability * 100}%
            </p>

            {/* 🤖 AI Summary */}
            <div className="mt-4">
              <AISummaryBox
                title="AI Insight"
                content={result.aiSummary}
              />
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}