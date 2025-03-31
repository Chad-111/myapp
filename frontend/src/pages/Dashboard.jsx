import React, { useEffect, useState, useRef } from 'react';
import LiveGameCard from '../components/LiveGameCard';
import UpcomingGameCard from '../components/UpcomingGameCard';
import PostGameCard from '../components/PostGameCard';

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
    const [selectedSport, setSelectedSport] = useState(() => localStorage.getItem("selectedSport") || "ncaa_mbb");
    const [scores, setScores] = useState([]);
    const [leagues, setLeagues] = useState([]);
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
                    newsRes.json()
                ]);
                setLeagues(scoresData.leagues || []);
                setScores(scoresData.events || []);
                setNews(newsData.articles || []);
            } catch (err) {
                console.error('Failed to fetch data.', err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
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
        const button = dropdownRef.current?.querySelector("button");
        const isOpen = menu?.classList.toggle("show");
        if (button) button.classList.toggle("active", isOpen);
    };

    const handleSportSelect = (key) => {
        setSelectedSport(key);
        const menu = document.getElementById("dropdownMenu");
        menu?.classList.remove("show");
    };

    const liveGames = scores.filter(event => event.status?.type?.state === 'in');
    const upcomingGames = scores.filter(event => event.status?.type?.state === 'pre');
    const finalGames = scores.filter(event => event.status?.type?.state === 'post');
    const liveFormatName = leagues.filter(league => league.id === liveGames[0]?.leagues?.[0]?.id)[0]?.name || 'Live Games';

    const hasSideColumnGames = liveGames.length > 0 || finalGames.length > 0;

    return (
        <div className="d-flex flex-column">
            <div className="border-bottom pb-2">
                <div className="mt-2 d-flex flex-wrap justify-content-between align-items-center mb-2">
                    <h1 className="mb-0 fs-3 fw-bold">Sports Dashboard</h1>
                    <div className="dropdown" ref={dropdownRef} style={{ minWidth: '180px' }}>
                        <button className="btn dropdown-toggle w-100 d-flex align-items-center justify-content-between" type="button" onClick={toggleDropdown} style={{ minHeight: '38px' }}>
                            <div className="d-flex align-items-center gap-2">
                                <img src={SPORTS[selectedSport].logo} alt={SPORTS[selectedSport].name} style={{ height: '24px', width: '24px' }} onError={(e) => (e.target.style.display = 'none')} />
                                <span>{SPORTS[selectedSport].name}</span>
                            </div>
                        </button>
                        <ul className="dropdown-menu w-100" id="dropdownMenu">
                            {Object.entries(SPORTS).map(([key, sport]) => (
                                <li key={key}>
                                    <button className={`dropdown-item d-flex align-items-center gap-2 ${key === selectedSport ? 'active' : ''}`} onClick={() => handleSportSelect(key)}>
                                        <img src={sport.logo} alt={sport.name} style={{ height: '20px', width: '20px' }} onError={(e) => (e.target.style.display = 'none')} />
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
                            <button className={`nav-link rounded-pill px-4 fw-semibold ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex-grow-1">
                {activeTab === 'scores' && (
                    <section className="container-fluid py-3">
                        <div className="row g-4">
                            {(liveGames.length > 0 || finalGames.length > 0) && (
                                <div className="col-12 col-md-4 col-lg-2">
                                    <div className="d-flex flex-column gap-3">
                                        {liveGames.length > 0 && (
                                            <>
                                                <h5 className="text-danger fw-bold mb-2">LIVE GAMES</h5>
                                                {liveGames.map(event => (
                                                    <LiveGameCard key={event.id} event={event} />
                                                ))}
                                            </>
                                        )}
                                        {finalGames.length > 0 && (
                                            <>
                                                <h6 className="text-muted fw-semibold mt-4 mb-2">FINAL SCORES</h6>
                                                {finalGames.map(event => (
                                                    <PostGameCard key={event.id} event={event} isFinal />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={liveGames.length > 0 || finalGames.length > 0 ? "col-auto col-lg-8 col-xl-9" : "col-auto"}>
                                <div className="row g-4 justify-content-center">
                                    {upcomingGames.length > 0 ? (
                                        <>
                                            <h2 className="display-6 pb-2">Upcoming Matchups</h2>
                                            {upcomingGames.map(event => (
                                                <div className="col-sm-4 col-md-12 col-lg-4" key={event.id}>
                                                    <UpcomingGameCard event={event} />
                                                </div>
                                            ))}
                                        </>
                                    ) : finalGames.length > 0 ? (
                                        <div className="col-12">
                                            <div className="card p-4 text-center bg-light-subtle shadow-sm border">
                                                <h4 className="fw-bold mb-2">No Upcoming Games</h4>
                                                <p className="text-muted mb-0">Check out the latest completed matchups in the sidebar.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="col-12 text-center">
                                            <p className="text-muted">No games available.</p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>


                    </section>
                )}
            </div>
        </div>
    );
}
