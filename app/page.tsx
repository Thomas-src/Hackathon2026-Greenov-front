import Link from "next/link";

export default function Home() {
    return (
        <div
            className="flex min-h-screen items-center justify-center p-4"
            style={{ background: "#0d2b1a", fontFamily: "'Nunito Sans', sans-serif", overflow: "hidden", position: "relative" }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;600&display=swap');

                @keyframes f1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
                @keyframes f2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                @keyframes f3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
                @keyframes f4 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes sunsp { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes windsp { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes sp { 0%,100%{opacity:.25} 50%{opacity:1} }

                .tree1 { animation: f1 3.4s ease-in-out infinite; }
                .tree2 { animation: f2 2.9s ease-in-out infinite 0.5s; }
                .tree3 { animation: f3 3.8s ease-in-out infinite 0.2s; }
                .tree4 { animation: f4 3.1s ease-in-out infinite 0.8s; }
                .sun-ray { animation: sunsp 14s linear infinite; transform-origin: 580px 38px; }
                .wind-blade { animation: windsp 3s linear infinite; transform-origin: 455px 113px; }

                .s1 { animation: sp 2.2s ease-in-out infinite 0s; }
                .s2 { animation: sp 2.2s ease-in-out infinite 0.4s; }
                .s3 { animation: sp 2.2s ease-in-out infinite 0.9s; }
                .s4 { animation: sp 2.2s ease-in-out infinite 1.3s; }
                .s5 { animation: sp 2.2s ease-in-out infinite 0.2s; }
                .s6 { animation: sp 2.2s ease-in-out infinite 1.7s; }

                .jr-btn-create {
                    width: 100%;
                    padding: 18px 24px;
                    border: none;
                    border-radius: 14px;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 800;
                    font-size: 18px;
                    cursor: pointer;
                    background: #4ade80;
                    color: #052e16;
                    box-shadow: 0 5px 0 #166534;
                    transition: transform 0.12s, box-shadow 0.12s;
                    text-decoration: none;
                    display: block;
                    text-align: center;
                    box-sizing: border-box;
                }
                .jr-btn-create:hover { transform: translateY(-2px); box-shadow: 0 7px 0 #166534; }
                .jr-btn-create:active { transform: translateY(3px); box-shadow: 0 2px 0 #166534; }

                .jr-btn-join {
                    width: 100%;
                    padding: 18px 24px;
                    border-radius: 14px;
                    font-family: 'Nunito', sans-serif;
                    font-weight: 800;
                    font-size: 18px;
                    cursor: pointer;
                    background: #1a4731;
                    color: #86efac;
                    box-shadow: 0 5px 0 #0a2018;
                    border: 2px solid #166534;
                    transition: transform 0.12s, box-shadow 0.12s;
                    text-decoration: none;
                    display: block;
                    text-align: center;
                    box-sizing: border-box;
                }
                .jr-btn-join:hover { transform: translateY(-2px); box-shadow: 0 7px 0 #0a2018; }
                .jr-btn-join:active { transform: translateY(3px); box-shadow: 0 2px 0 #0a2018; }
            `}</style>

            <main
                className="flex flex-col items-center gap-6"
                style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 640 }}
            >
                {/* Title */}
                <div className="text-center">
                    <h1 className="text-4xl font-black" style={{color: "var(--green)"}}>Greenov</h1>
                    <p style={{
                        marginTop: 10,
                        fontSize: 13,
                        color: "rgba(200,240,210,0.6)",
                        maxWidth: 340,
                        lineHeight: 1.6,
                        margin: "10px auto 0",
                    }}>
                        Jeu interactif « Parcours Zéro Implication – Zéro Émission » : comprendre, décider, transformer
                    </p>
                </div>

                {/* Scene */}
                <svg
                    viewBox="0 0 680 220"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: "100%", maxWidth: 640 }}
                >
                    {/* Stars */}
                    <circle cx="30"  cy="18" r="1.5" fill="#4ade80" className="s1" />
                    <circle cx="160" cy="10" r="1"   fill="#86efac" className="s2" />
                    <circle cx="310" cy="22" r="1.5" fill="#4ade80" className="s3" />
                    <circle cx="450" cy="8"  r="1"   fill="#86efac" className="s4" />
                    <circle cx="90"  cy="45" r="1"   fill="#4ade80" className="s5" />
                    <circle cx="530" cy="30" r="1.5" fill="#86efac" className="s6" />

                    {/* Sun */}
                    <circle cx="580" cy="38" r="22" fill="#fbbf24" />
                    <g className="sun-ray">
                        <line x1="580" y1="9"  x2="580" y2="4"  stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                        <line x1="580" y1="67" x2="580" y2="72" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                        <line x1="551" y1="38" x2="546" y2="38" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                        <line x1="609" y1="38" x2="614" y2="38" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                        <line x1="559" y1="17" x2="556" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="601" y1="17" x2="604" y2="14" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="559" y1="59" x2="556" y2="62" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="601" y1="59" x2="604" y2="62" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                    </g>

                    {/* Cloud */}
                    <g opacity="0.55">
                        <ellipse cx="70" cy="28" rx="24" ry="13" fill="#d1fae5" />
                        <ellipse cx="90" cy="30" rx="18" ry="11" fill="#d1fae5" />
                        <ellipse cx="50" cy="32" rx="14" ry="9"  fill="#d1fae5" />
                    </g>

                    {/* Ground */}
                    <rect x="0" y="185" width="680" height="35" fill="#1a4731" />
                    <rect x="0" y="185" width="680" height="7"  fill="#16a34a" />

                    {/* Grass tufts */}
                    <ellipse cx="60"  cy="185" rx="22" ry="7" fill="#15803d" />
                    <ellipse cx="185" cy="185" rx="18" ry="6" fill="#16a34a" />
                    <ellipse cx="340" cy="185" rx="25" ry="7" fill="#15803d" />
                    <ellipse cx="495" cy="185" rx="18" ry="6" fill="#16a34a" />
                    <ellipse cx="620" cy="185" rx="22" ry="7" fill="#15803d" />

                    {/* ── TREE 1 — sapin, far left x=60 ── */}
                    <g className="tree1">
                        <rect x="53" y="162" width="14" height="28" rx="3" fill="#78350f" />
                        <polygon points="60,75  30,140 90,140" fill="#14532d" />
                        <polygon points="60,55  33,115 87,115" fill="#15803d" />
                        <polygon points="60,38  36,95  84,95"  fill="#16a34a" />
                        <polygon points="60,22  38,72  82,72"  fill="#22c55e" />
                        <polygon points="60,22  55,38  65,38"  fill="#d1fae5" opacity="0.6" />
                        <circle cx="60" cy="20" r="5" fill="#fde047" />
                    </g>

                    {/* ── TREE 2 — feuillu 3D, x=210 ── */}
                    <g className="tree2">
                        <rect x="204" y="155" width="12" height="35" rx="3" fill="#92400e" />
                        <ellipse cx="210" cy="115" rx="46" ry="52" fill="#14532d" />
                        <ellipse cx="210" cy="110" rx="42" ry="48" fill="#166534" />
                        <ellipse cx="210" cy="105" rx="38" ry="44" fill="#16a34a" />
                        <ellipse cx="196" cy="92"  rx="18" ry="16" fill="#22c55e" />
                        <circle cx="198" cy="118" r="4"   fill="#ef4444" />
                        <circle cx="222" cy="124" r="3.5" fill="#ef4444" />
                        <circle cx="212" cy="108" r="3"   fill="#fbbf24" />
                        {/* Solar panel leaning on trunk */}
                        <rect x="222" y="158" width="22" height="16" rx="2" fill="#1e3a8a" />
                        <line x1="222" y1="164" x2="244" y2="164" stroke="#3b82f6" strokeWidth="0.8" />
                        <line x1="233" y1="158" x2="233" y2="174" stroke="#3b82f6" strokeWidth="0.8" />
                    </g>

                    {/* ── TREE 3 — palmier tropical, x=370 ── */}
                    <g className="tree3">
                        <path d="M367 190 Q362 160 370 130 Q375 100 368 75" fill="none" stroke="#92400e" strokeWidth="13" strokeLinecap="round" />
                        <path d="M367 190 Q362 160 370 130 Q375 100 368 75" fill="none" stroke="#b45309" strokeWidth="8"  strokeLinecap="round" />
                        <path d="M368 76 Q330 55 295 70"  fill="none" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
                        <path d="M368 76 Q350 40 340 18"  fill="none" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
                        <path d="M368 76 Q395 42 415 22"  fill="none" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
                        <path d="M368 76 Q405 58 438 65"  fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
                        <path d="M368 76 Q335 78 305 90"  fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="358" cy="82" r="7" fill="#92400e" />
                        <circle cx="372" cy="86" r="6" fill="#78350f" />
                        <circle cx="364" cy="90" r="5" fill="#92400e" />
                    </g>

                    {/* ── WIND TURBINE x=455 ── */}
                    <line x1="455" y1="185" x2="455" y2="115" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="455" cy="113" r="5" fill="#d1d5db" />
                    <g className="wind-blade">
                        <line x1="455" y1="113" x2="455" y2="80"  stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
                        <line x1="455" y1="113" x2="484" y2="130" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
                        <line x1="455" y1="113" x2="426" y2="130" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* ── TREE 4 — chêne 3D, x=560 ── */}
                    <g className="tree4">
                        <rect x="554" y="158" width="12" height="32" rx="3" fill="#92400e" />
                        <ellipse cx="560" cy="120" rx="50" ry="55" fill="#14532d" />
                        <ellipse cx="560" cy="114" rx="45" ry="50" fill="#166534" />
                        <ellipse cx="560" cy="108" rx="40" ry="45" fill="#16a34a" />
                        <ellipse cx="540" cy="100" rx="22" ry="20" fill="#15803d" />
                        <ellipse cx="580" cy="105" rx="20" ry="18" fill="#15803d" />
                        <ellipse cx="560" cy="90"  rx="20" ry="18" fill="#22c55e" />
                        <ellipse cx="547" cy="95"  rx="14" ry="12" fill="#4ade80" opacity="0.5" />
                        <path d="M582 78 Q587 73 592 78 Q597 73 602 78" fill="none" stroke="#052e16" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                </svg>

                {/* Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
                    <Link href="/create">
                        <span className="jr-btn-create">Créer une partie</span>
                    </Link>
                    <Link href="/join">
                        <span className="jr-btn-join">Rejoindre une partie</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}