import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

function ArchitectureSection() {
  return (
    <section className="relative py-24 px-6 bg-[#0a0a0f]" id="about">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2 initial={{ width: '0%' }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-5xl md:text-7xl font-bold text-white tracking-tight overflow-hidden">
            CRIMEAI'S
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">ARCHITECTURE</span>
          </motion.h2>
          <div className="mt-4 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mx-auto max-w-xs" />
        </div>

        {/* CodeGenie */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
          <div className="flex-shrink-0">
            <TorusScene />
          </div>
          <div className="text-center md:text-left">
            <span className="font-mono font-bold tracking-wider text-3xl md:text-4xl text-white">
                AI Engine
              </span>
              <p className="mt-2 text-purple-400 font-medium">
                Crime Detection & Prediction
              </p>
              <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-md">
                Our AI model analyzes video frames and structured data to detect violence,
                predict crime risk, and generate intelligent summaries using machine learning.
              </p>
          </div>
        </div>

        {/* EditWizard */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-24">
          <div className="flex-shrink-0">
            <div className="w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="relative w-48 h-48">
                {[...Array(8)].map((_, i) => (
                  <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-purple-500/20" animate={{ rotate: i * 45, scale: 1 - i * 0.1 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} />
                ))}
              </motion.div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <span className="font-mono font-bold tracking-wider text-3xl md:text-4xl text-white">
              Smart Dashboard
            </span>
            <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
              <span className="text-purple-400 font-medium">
                Monitoring & Analytics
              </span>
            </div>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-md">
              A modern dashboard to monitor cameras, visualize crime trends,
              manage alerts, and gain insights through AI-powered analytics.
            </p>
            {/* <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-md ml-auto">EditWizard allows you to easily modify existing smart contracts through chat or direct code edits.</p> */}
          </div>
        </div>

        {/* DeployBot */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-shrink-0">
            <div className="w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center">
              <motion.div className="grid grid-cols-3 gap-3">
                {[...Array(9)].map((_, i) => (
                  <motion.div key={i} className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/40 to-purple-800/20 border border-purple-500/20" animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
                ))}
              </motion.div>
            </div>
          </div>
          <div className="text-center md:text-left">
            <span className="font-mono font-bold tracking-wider text-3xl md:text-4xl text-white">
              Smart Dashboard
            </span>
            <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
              <span className="text-purple-400 font-medium">
                Monitoring & Analytics
              </span>
            </div>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-md">
              A modern dashboard to monitor cameras, visualize crime trends,
              manage alerts, and gain insights through AI-powered analytics.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-24 text-center">
        <span className="text-[10px] px-3 py-1.5 rounded-full bg-white/5 text-gray-500 border border-white/10">reviews</span>
      </div>
    </section>
  );
}

function TorusScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const cw = mount.clientWidth;
    const ch = mount.clientHeight;
    renderer.setSize(cw, ch);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const torusGeo = new THREE.TorusGeometry(1.5, 0.4, 16, 32);
    const torusMat = new THREE.MeshPhongMaterial({ color: 0x7C3AED, emissive: 0x3B0764, specular: 0xA78BFA, shininess: 100, flatShading: true });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    scene.add(torus);

    const edgesGeo = new THREE.EdgesGeometry(torusGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xA78BFA, transparent: true, opacity: 0.4 });
    torus.add(new THREE.LineSegments(edgesGeo, edgesMat));

    const light1 = new THREE.DirectionalLight(0x8B5CF6, 1.5);
    light1.position.set(3, 3, 5);
    scene.add(light1);
    const light2 = new THREE.DirectionalLight(0x6D28D9, 0.8);
    light2.position.set(-3, -2, 3);
    scene.add(light2);
    scene.add(new THREE.AmbientLight(0x4C1D95, 0.4));

    let animFrame;
    const animate = (time) => {
      animFrame = requestAnimationFrame(animate);
      torus.rotation.x = time * 0.0003;
      torus.rotation.y = time * 0.0005;
      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      cancelAnimationFrame(animFrame);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-64 h-64 md:w-80 md:h-80" />;
}


export default ArchitectureSection;