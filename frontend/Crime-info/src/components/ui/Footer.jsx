import React from "react";

function Footer() {
  const columns = [
    {
      title: "Team",
      links: [
        { name: "Abhishek Kaushik", url: "#" },
        { name: "Siddharth Kaushik", url: "#" },
        { name: "Saurabh Pandey", url: "#" },
        { name: "Shivam", url: "https://portfolio-vxrf.vercel.app/" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", url: "#" },
        { name: "API Reference", url: "#" },
        { name: "Community Forum", url: "#" },
      ],
    },
    {
      title: "Connect",
      links: [
        { name: "Twitter", url: "#" },
      ],
      isSocial: true,
    },
  ];

  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-12 gap-12">

          {/* LEFT SECTION */}
          <div className="md:col-span-5">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Secure Your Area <br />
              in Minutes,<br />
              Not Days.
            </h3>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 w-fit">
              <span className="text-sm text-gray-400">
                Rate your experience
              </span>

              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMNS */}
          {columns.map((col, i) => (
            <div
              key={i}
              className="md:col-span-2 border-l border-white/10 pl-6"
            >
              <h4 className="text-lg font-semibold text-white mb-4">
                {col.title}
              </h4>

              <ul className="space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      target={item.url !== "#" ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      {col.isSocial && item.name === "Twitter" && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
          
          <div className="flex items-center gap-4">
            <span className="font-mono text-3xl md:text-5xl font-bold tracking-[0.3em] text-white">
              CRIMEAI
            </span>

            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path
                d="M20 80C20 80 40 95 60 95C80 95 90 80 90 80"
                stroke="url(#footGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M15 55C15 55 40 75 60 75C80 75 95 55 95 55"
                stroke="url(#footGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M10 30C10 30 40 55 60 55C80 55 100 30 100 30"
                stroke="url(#footGrad)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="footGrad" x1="10" y1="20" x2="100" y2="95">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          © 2026 CrimeAI. Powered by AI.
        </p>
      </div>
    </footer>
  );
}

export default Footer;