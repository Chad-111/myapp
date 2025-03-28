import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const SPORTS = {
    nhl: { name: "NHL", path: "hockey/nhl", logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png" },
    nba: { name: "NBA", path: "basketball/nba", logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png" },
    nfl: { name: "NFL", path: "football/nfl", logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" },
    mlb: { name: "MLB", path: "baseball/mlb", logo: "https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png" },
    ncaaf: { name: "NCAA FB", path: "football/college-football", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/default.png" },
    ncaa_mbb: { name: "NCAA MBB", path: "basketball/mens-college-basketball", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/default.png" }
};

export default function Dashboard() {
    const [selectedSport, setSelectedSport] = useState(() => {
        return localStorage.getItem("selectedSport") || "ncaa_mbb";
    });
    const [scores, setScores] = useState([]);
    const [news, setNews] = useState([]);
    const [activeTab, setActiveTab] = useState('scores');
    const [selectedArticle, setSelectedArticle] = useState(null);
        
    const dropdownRef = useRef(null);
    const sportPath = SPORTS[selectedSport].path;

    useEffect(() => {
        localStorage.setItem("selectedSport", selectedSport);
    }, [selectedSport]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [scoresRes, newsRes] = await Promise.all([
                    fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard`),
                    fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/news`)
                ]);

                const [scoresData, newsData] = await Promise.all([
                    scoresRes.json(),
                    newsRes.json(),
                ]);

                setScores(scoresData.events || []);
                setNews(newsData.articles || []);
            } catch (err) {
                console.error('Failed to fetch data.', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [selectedSport]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                const menu = document.getElementById("dropdownMenu");
                menu?.classList.remove("show");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        const menu = document.getElementById("dropdownMenu");
        menu?.classList.toggle("show");
    };

    const handleSportSelect = (key) => {
        setSelectedSport(key);
        const menu = document.getElementById("dropdownMenu");
        menu?.classList.remove("show");
    };

    return (
        <div className="vh-100 d-flex flex-column overflow-hidden">
            <div className="border-bottom pb-2 ">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                    <h1 className="mb-0 fs-3 fw-bold">Sports Dashboard</h1>

                    <div className="dropdown" ref={dropdownRef} style={{ minWidth: '180px' }}>
                        <button
                            className="btn btn-outline-primary dropdown-toggle w-100 d-flex align-items-center justify-content-between"
                            type="button"
                            onClick={toggleDropdown}
                            style={{ minHeight: '38px' }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <img
                                    src={SPORTS[selectedSport].logo}
                                    alt={SPORTS[selectedSport].name}
                                    style={{ height: '24px', width: '24px' }}
                                    onError={(e) => (e.target.style.display = 'none')}
                                />
                                <span>{SPORTS[selectedSport].name}</span>
                            </div>
                        </button>
                        <ul className="dropdown-menu w-100" id="dropdownMenu">
                            {Object.entries(SPORTS).map(([key, sport]) => (
                                <li key={key}>
                                    <button
                                        className={`dropdown-item d-flex align-items-center gap-2 ${key === selectedSport ? 'active' : ''}`}
                                        onClick={() => handleSportSelect(key)}
                                    >
                                        <img
                                            src={sport.logo}
                                            alt={sport.name}
                                            style={{ height: '20px', width: '20px' }}
                                            onError={(e) => (e.target.style.display = 'none')}
                                        />
                                        {sport.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <ul className="nav nav-pills gap-2 justify-content-center border-top pt-2">
                    {['scores', 'news'].map(tab => (
                        <li className="nav-item" key={tab}>
                            <button
                                className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex-grow-1 overflow-auto">
                {/* Scores Tab */}
                {
                    activeTab === 'scores' && (
                        <section className="container py-3">
                            <h2>Upcoming Matchups</h2>
                            <div className="row">
                                {scores.map(event => {
                                    const competition = event.competitions?.[0];
                                    const home = competition?.competitors?.find(c => c.homeAway === 'home');
                                    const away = competition?.competitors?.find(c => c.homeAway === 'away');
                                    const odds = competition?.odds?.[0];
                                    return (
                                        <div className="col-md-4 mb-4" key={event.id}>
                                            <div className="card w-100 h-100 p-3 d-flex flex-column justify-content-between">
                                                <div>
                                                    <h5 className="text-center">{home?.team?.displayName} vs {away?.team?.displayName}</h5>
                                                    <p className="text-center">{event.date && new Date(event.date).toLocaleString()}</p>
                                                    <div className="row justify-content-center align-items-center mb-3">
                                                        <div className="col-4 text-center">
                                                            <img src={home?.team?.logo} alt={home?.team?.displayName} style={{ maxWidth: '50px' }} />
                                                        </div>
                                                        <div className="col-4 text-center fw-bold">VS</div>
                                                        <div className="col-4 text-center">
                                                            <img src={away?.team?.logo} alt={away?.team?.displayName} style={{ maxWidth: '50px' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {odds && (
                                                    <div className="card-footer text-muted text-center">
                                                        <div className="fw-semibold">{odds.details}</div>
                                                        <small>Odds by <span className="fw-bold">{odds.provider?.name}</span></small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )
                }

                {/* News Tab */}
                {
                    activeTab === 'news' && (
                        <section className="container py-3">
                            <h2>News</h2>
                            <div className="row">
                                {news.map(article => {
                                    const previewImage = article.images?.find(img => ['16x9', '5x2'].includes(img.ratio)) || article.images?.[0];
                                    const isMediaClip = article?.type === 'Media';
                                    const clipId = article?.links?.web?.href?.split('id=')[1];

                                    return (
                                        <div className="col-md-3 mb-4" key={article.id}>
                                            <div
                                                className="card w-100 h-100 p-0 overflow-hidden"
                                                onClick={() => setSelectedArticle(article)}
                                                data-bs-toggle="modal"
                                                data-bs-target="#newsModal"
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="position-relative">
                                                    {isMediaClip && clipId ? (
                                                        <div className="ratio ratio-16x9">
                                                            <iframe
                                                                src={`https://www.espn.com/core/video/iframe?id=${clipId}&autoplay=true&mute=true&endcard=false`}
                                                                title={article.headline}
                                                                allow="autoplay; encrypted-media"
                                                                allowFullScreen
                                                                frameBorder="0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        previewImage && (
                                                            <img
                                                                src={previewImage.url}
                                                                alt={article.headline}
                                                                className="w-100"
                                                                style={{ height: '20vh', objectFit: 'cover', borderTopLeftRadius: '6px', borderTopRightRadius: '6px', backgroundColor: '#000' }}
                                                            />
                                                        )
                                                    )}
                                                    <div className="position-absolute bottom-0 start-0 w-100 text-white bg-dark bg-opacity-50 px-2 py-1">
                                                        <strong>{article.headline}</strong>
                                                    </div>
                                                </div>
                                                <div className="p-3">
                                                    <p className="text-muted small">{article.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )
                }

                {/* News Modal */}
                <div className="modal fade" id="newsModal" tabIndex="-1" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            {selectedArticle && (
                                <>
                                    <div className="modal-header">
                                        <h5 className="modal-title">{selectedArticle.headline}</h5>
                                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                                    </div>
                                    <div className="modal-body text-center">
                                        {selectedArticle.type === 'Media' && selectedArticle.links?.web?.href?.includes('id=') ? (
                                            <div className="ratio ratio-16x9 mb-3">
                                                <iframe
                                                    src={`https://www.espn.com/core/video/iframe?id=${selectedArticle.links.web.href.split('id=')[1]}&autoplay=true&endcard=false`}
                                                    title={selectedArticle.headline}
                                                    allow="autoplay; encrypted-media"
                                                    allowFullScreen
                                                    frameBorder="0"
                                                />
                                            </div>
                                        ) : (
                                            selectedArticle.images?.[0]?.url && (
                                                <img
                                                    src={selectedArticle.images[0].url}
                                                    alt={selectedArticle.headline}
                                                    className="img-fluid mb-3"
                                                    style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                />
                                            )
                                        )}
                                        <p className="text-muted">{selectedArticle.description}</p>
                                        <a href={selectedArticle.links?.web?.href} target="_blank" rel="noreferrer" className="btn btn-outline-primary mt-2">
                                            View Full Article
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}