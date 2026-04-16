import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

function FeaturesSection() {
  return (
    <section className="relative py-32 px-6 bg-[#7C3AED] overflow-hidden" id="features">
      <div className="absolute inset-0 opacity-10"
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16 relative z-10"
      >
        <p className="text-sm text-purple-200 tracking-widest mb-3 font-mono">fin-tastic features. zero-hassle.</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-3xl mx-auto">
          BECAUSE DETECTION MAKE SURE<br />
          <span className="text-yellow-300">YOUR SLEEP SHOULDN'T RUIN</span>
        </h2>
        <p className="text-purple-200/70 max-w-2xl mx-auto text-sm tracking-wide">
          Transform your crime detection ideas into production-ready AI models seamlessly.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-4 md:gap-6">
          <FeatureCard
            badge="REAL-TIME"
            badgeColor="text-red-600 bg-red-50 border-red-100"
            dotColor="bg-red-500"
            iconBg="from-red-500/10 to-red-600/5"
            icon={<RustIcon />}
            title="Live Detection"
            desc="Detect violence and suspicious activity from live camera feeds using AI"
            footer="WebSocket + AI"
            delay={0}
          />

          <FeatureCard
            badge="ALERT SYSTEM"
            badgeColor="text-yellow-600 bg-yellow-50 border-yellow-100"
            dotColor="bg-yellow-500"
            iconBg="from-yellow-500/10 to-yellow-600/5"
            icon={<BoltIcon />}
            title="Instant Alerts"
            desc="Automatically trigger alerts with severity levels when crime is detected"
            footer="Real-time"
            delay={0.1}
          />

          <FeatureCard
            badge="PREDICTION"
            badgeColor="text-purple-600 bg-purple-50 border-purple-100"
            dotColor="bg-purple-500"
            iconBg="from-purple-500/10 to-purple-600/5"
            icon={<WinterIcon />}
            title="Crime Prediction"
            desc="Predict future crimes based on location, time, and historical patterns"
            footer="ML Model"
            delay={0.2}
          />

          <FeatureCard
            badge="ANALYTICS"
            badgeColor="text-blue-600 bg-blue-50 border-blue-100"
            dotColor="bg-blue-500"
            iconBg="from-blue-500/10 to-blue-600/5"
            icon={<AnchorIcon />}
            title="Hotspot Analysis"
            desc="Identify high-risk areas and peak crime times using AI insights"
            footer="AI Trends"
            delay={0.3}
          />

          <FeatureCard
            badge="DASHBOARD"
            badgeColor="text-emerald-600 bg-emerald-50 border-emerald-100"
            dotColor="bg-emerald-500"
            iconBg="from-emerald-500/10 to-emerald-600/5"
            icon={<ShieldIcon />}
            title="Smart Dashboard"
            desc="Monitor cameras, alerts, and crime analytics in one unified interface"
            footer="Full Stack"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ badge, badgeColor, dotColor, iconBg, icon, title, desc, footer, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
      whileHover={{ y: -5, rotate: [0, -2, 0] }}
      className="relative flex-shrink-0 w-[180px] md:w-[200px] p-5 rounded-xl bg-[#FFFEF8] shadow-xl shadow-black/20 border border-gray-200/50 transition-all duration-300"
    >
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${dotColor}`} />
      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${badgeColor}`}>{badge}</span>
      <div className={`mt-4 w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center`}>{icon}</div>
      <h3 className="mt-3 text-sm font-bold text-gray-900 text-center">{title}</h3>
      <p className="mt-1 text-[10px] text-gray-500 text-center leading-relaxed">{desc}</p>
      <div className="mt-3 flex justify-center">
        <span className="text-[9px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{footer}</span>
      </div>
    </motion.div>
  );
}

function RustIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#DC2626" strokeWidth="1.5" /><circle cx="12" cy="12" r="3" fill="#DC2626" /><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.64 5.64l4.24 4.24M14.12 14.12l4.24 4.24M5.64 18.36l4.24-4.24M14.12 9.88l4.24-4.24" stroke="#DC2626" strokeWidth="1" /></svg>;
}
function BoltIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="#FACC15"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
}
function WinterIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M3 17C3 17 8 20 12 20C16 20 21 17 21 17" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" /><path d="M3 12C3 12 8 15 12 15C16 15 21 12 21 12" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" /><path d="M3 7C3 7 8 10 12 10C16 10 21 7 21 7" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function AnchorIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5"><circle cx="12" cy="5" r="3" /><line x1="12" y1="8" x2="12" y2="21" /><path d="M5 12H2a10 10 0 0020 0h-3" /></svg>;
}
function ShieldIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="1.5" /><path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}


export default FeaturesSection;