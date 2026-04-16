import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

function TestimonialsSection() {
  return (
    <section className="relative py-24 px-6 bg-[#050508]">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Person tales<br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">from the Road</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {[                                                            
            { name: "Abhishek.", role: "Student", text: "Find crime hotspot in copuls of second. Good for human" },
            { name: "Siddharth", role: "Student", text: "The AI tell 3 Crime Which happend near to me. Absolutely incredible." },
            { name: "Shivam", role: "Student", text: "Reduced our contract development time by 80%. Game changer for our team." },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="p-6 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/20 transition-colors">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#FACC15"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default TestimonialsSection;