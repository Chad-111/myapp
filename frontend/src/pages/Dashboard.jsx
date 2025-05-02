import React, { useEffect, useState, useRef } from 'react';
import LiveGameCard from '../components/LiveGameCard';
import UpcomingGameCard from '../components/UpcomingGameCard';
import PostGameCard from '../components/PostGameCard';
import { useTranslation } from 'react-i18next';


import './Dashboard.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const SPORTS = {
    nhl: { name: "NHL", path: "hockey/nhl", logo: "https://a.espncdn.com/i/teamlogos/leagues/500-dark/nhl.png" },
    nba: { name: "NBA", path: "basketball/nba", logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500-dark/nba.png&w=500&h=500&transparent=true" },
    nfl: { name: "NFL", path: "football/nfl", logo: "https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png" },
    mlb: { name: "MLB", path: "baseball/mlb", logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500-dark/mlb.png&w=500&h=500&transparent=true" },
    golf: { name: "Golf", path: "golf/pga", logo: "https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-golf.png" },
    ncaaf: { name: "NCAA FB", path: "football/college-football", logo: "https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-football-college.png" },
    ncaa_mbb: { name: "NCAA MBB", path: "basketball/mens-college-basketball", logo: "https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-basketball.png" }
};


export default function Dashboard() {
    const [selectedSport, setSelectedSport] = useState(() => localStorage.getItem("selectedSport") || "nhl");
    const [games, setGames] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [news, setNews] = useState([]);
    const [activeTab, setActiveTab] = useState('games');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedLiveGame, setSelectedLiveGame] = useState(null);
    const [showLiveModal, setShowLiveModal] = useState(false);
    const [selectedFinalGame, setSelectedFinalGame] = useState(null);
    const [finalGameSummary, setFinalGameSummary] = useState(null);
    const [showFinalModal, setShowFinalModal] = useState(false);
    const { t } = useTranslation();


    function formatDateForESPN(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = formatDateForESPN(today);
    const tomorrowStr = formatDateForESPN(tomorrow);

    const dropdownRef = useRef(null);
    const sportPath = SPORTS[selectedSport].path;

    useEffect(() => {
        localStorage.setItem("selectedSport", selectedSport);
    }, [selectedSport]);

    const intervalRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesRes, newsRes] = await Promise.all([
                    fetch(`/api/scoreboard?sport=${selectedSport}&dates=${todayStr}-${tomorrowStr}`),
                    fetch(`/api/news?sport=${selectedSport}`)
                ]);

                const [scoresData, newsData] = await Promise.all([
                    gamesRes.json(),
                    newsRes.json()
                ]);
                setLeagues(scoresData.leagues || []);
                setGames(scoresData.events || []);
                setNews(newsData.articles || []);
            } catch (err) {
                console.error('Failed to fetch data.', err);
            }
        };

        const startPolling = () => {
            if (intervalRef.current === null) {
                intervalRef.current = setInterval(fetchData, 10000);
            }
        };

        const stopPolling = () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        fetchData(); // fetch immediately on mount
        startPolling();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchData();  // fetch immediately when tab becomes visible
                startPolling();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [selectedSport]);


    const fetchFinalGameSummary = async (gameId) => {
        try {
            const res = await fetch(`/api/summary?sport=${selectedSport}&gameId=${gameId}`);
            const data = await res.json();
            setFinalGameSummary(data.boxscore);
            setShowFinalModal(true);
        } catch (err) {
            console.error('Failed to fetch post-game summary:', err);
        }
    };

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

    const liveGames = games.filter(event => event.status?.type?.state === 'in');
    const upcomingGames = games.filter(event => event.status?.type?.state === 'pre');
    const finalGames = games.filter(event => event.status?.type?.state === 'post');
    const liveFormatName = leagues.filter(league => league.id === liveGames[0]?.leagues?.[0]?.id)[0]?.name || 'Live Games';

    const hasSideColumnGames = liveGames.length > 0 || finalGames.length > 0;


    return (
        <div className="d-flex flex-column">
            <div className="border-bottom">
                <div className="d-flex align-items-center justify-content-between flex-wrap mt-2 mb-2 px-2 gap-2">
                    {/* Tabs - Centered */}
                    <ul className="nav nav-pills gap-2 me-auto order-1 order-lg-0">
                        {['games', 'news'].map(tab => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link rounded-pill px-4 ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {t(`tabs.${tab}`)}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Dropdown - Right on desktop, below on mobile */}
                    <div
                        className="dropdown ms-auto order-0 order-lg-1"
                        ref={dropdownRef}
                        style={{ minWidth: '180px' }}
                    >
                        <button
                            className="btn dropdown-toggle w-100 d-flex align-items-center justify-content-between"
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
            </div>


            {/* Main Content START */}
            <div className="flex-grow-1">
                {/* Games Tab = ACTIVE */}
                {activeTab === 'games' && (
                    <section className="container-fluid py-3">
                        <div className="row">
                            {/* Large screen layout: left (live), center (upcoming), right (final) */}
                            <div className="d-none d-lg-block">
                                <div className="row justify-content-around">
                                    {/* At LEAST 1 LIVE Game Active */}
                                    {/* LIVE Games (Left Column) */}
                                    {liveGames.length > 0 && (
                                        <div className="col-lg-2 mb-auto">
                                            <div className="d-flex justify-content-center align-items-center mb-2">
                                                <span className="live-badge">{t('badges.live')}</span>
                                            </div>
                                            {liveGames.map(event => (
                                                <LiveGameCard
                                                    key={event.id}
                                                    event={event}
                                                    onClick={() => {
                                                        setSelectedLiveGame(event);
                                                        setShowLiveModal(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Center for Upcoming Games */}
                                    <div className="col-8 mb-auto">
                                        <h2 className="pb-3">{t('headings.upcoming')}</h2>

                                        <div className="row g-2 justify-content-center">
                                            {upcomingGames.length > 0 ? (
                                                upcomingGames.map(event => (
                                                    <div className="col-12 col-sm-6 col-lg-6 col-xl-4" key={event.id}>
                                                        <UpcomingGameCard
                                                            event={event}
                                                            onClick={event => {
                                                                setSelectedGame(event);
                                                                setShowModal(true);
                                                            }}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                // If no upcoming games, show this card
                                                <div className="card p-4 text-center bg-light-subtle shadow-sm border">
                                                    <h4 className='fw-bold mb-2'>{t('headings.noUpcoming')}</h4>
                                                    <p className="text-muted mb-0">{t('headings.noUpcomingSub')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* FINAL Games (Right Column) */}
                                    {finalGames.length > 0 && (
                                        <div className="col-lg-2 mb-auto">
                                            <div className="d-flex justify-content-center align-items-center mb-2">
                                                <span className="final-badge">{t('badges.final')}</span>
                                            </div>
                                            {finalGames.map(event => (
                                                <PostGameCard
                                                    isFinal
                                                    key={event.id}
                                                    event={event}
                                                    onClick={() => {
                                                        setSelectedFinalGame(event);
                                                        fetchFinalGameSummary(event.id);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                            {/* END Large Screen Layout */}

                            {/* Medium and below layout: Live and Final (TOP half/half) Upcoming Games (BELOW full width) */}
                            <div className="d-lg-none">
                                <div className="row g-4 mb-auto">
                                    {/* At LEAST 1 Live Game ACTIVE */}
                                    {liveGames.length > 0 && (
                                        <div className="col-12 col-md-6">
                                            <div className="d-flex justify-content-center align-items-center mb-2">
                                                <span className="live-badge">{t('badges.live')}</span>
                                            </div>
                                            {liveGames.map(event => (
                                                <LiveGameCard
                                                    key={event.id}
                                                    event={event}
                                                    onClick={() => {
                                                        setSelectedLiveGame(event);
                                                        setShowLiveModal(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {/* At LEAST 1 Finished Game */}
                                    {finalGames.length > 0 && (
                                        <div className="col-12 col-md-6">
                                            <div className="d-flex justify-content-center align-items-center mb-2">
                                                <span className="final-badge">{t('badges.final')}</span>
                                            </div>
                                            {finalGames.map(event => (
                                                <PostGameCard
                                                    isFinal
                                                    key={event.id}
                                                    event={event}
                                                    onClick={() => {
                                                        setSelectedFinalGame(event);
                                                        fetchFinalGameSummary(event.id);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Upcoming Games */}
                                <div className="col-12 mt-3">
                                    <h2 className="pb-3">Upcoming Matchups</h2>
                                    <div className="row g-2 justify-content-center">
                                        {upcomingGames.length > 0 ? (
                                            upcomingGames.map(event => (
                                                <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={event.id}>
                                                    <UpcomingGameCard
                                                        event={event}
                                                        onClick={event => {
                                                            setSelectedGame(event);
                                                            setShowModal(true);
                                                        }}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            // If no upcoming games, show this card
                                            <div className="card p-4 text-center bg-light-subtle shadow-sm border">
                                                <h4 className='fw-bold mb-2'>{t('headings.noUpcoming')}</h4>
                                                <p className="text-muted mb-0">{t('headings.noUpcomingSub')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* END Medium and below layout */}
                        </div>
                    </section>
                )}
                {/* END Games Tab */}

                {/* News Tab = ACTIVE */}
                {activeTab === 'news' && (
                    <section className="container py-4">
                        {/* Header START */}
                        <h2 className="pb-3 border-bottom">{t('headings.topStories')}</h2>
                        <div className="row g-4">
                            {/* If At LEAST 1 News Article */}
                            {news.length > 0 ? (
                                news.map((article, index) => (
                                    <div className="col-12 col-md-6 col-lg-4" key={index}>
                                        <div className="card h-100 shadow-sm">
                                            {/* Display the image linked to article */}
                                            {article.images?.[0]?.url && (
                                                <img
                                                    src={article.images[0].url}
                                                    alt={article.headline}
                                                    className="card-img-top"
                                                    style={{ objectFit: 'cover', height: '180px' }}
                                                />
                                            )}
                                            {/* Article Headline */}
                                            <div className="card-body d-flex flex-column">
                                                <h5 className="card-title">{article.headline}</h5>
                                                {/* Article Body (Description) */}
                                                <p className="card-text small text-muted mb-2">
                                                    {article.description || 'No description available.'}
                                                </p>
                                                {/* Article Source */}
                                                <a href={article.links?.web?.href || '#'} className="btn btn-outline-primary mt-auto" target="_blank" rel="noopener noreferrer">
                                                    {t('buttons.readMore')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // If NO News Articles, show this message
                                <div className="text-muted">{t('messages.noNewsAvailable')}</div>
                            )}
                        </div>
                    </section>
                )}
                {/* END News Tab */}

                {/* If Upcoming Games Card clicked, show stats modal */}
                {showModal && selectedGame && (() => {
                    const competitors = selectedGame?.competitions?.[0]?.competitors;
                    if (!competitors) return null;

                    const sortedTeams = [...competitors].sort((a, b) => {
                        if (a.homeAway === 'away') return -1;
                        if (b.homeAway === 'away') return 1;
                        return 0;
                    });

                    return (
                        <div
                            className="modal fade show d-block"
                            tabIndex="-1"
                            role="dialog"
                            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                        >
                            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                                <div className="modal-content border-0 shadow-lg">
                                    <div className="modal-header justify-content-center border-0 pb-0">
                                        <div className="text-center w-100">
                                            <h5 className="modal-title fw-bold">
                                                {sortedTeams[0]?.team?.displayName} ${t('modals.vs')} ${sortedTeams[1]?.team?.displayName}
                                            </h5>

                                        </div>
                                        <button
                                            type="button"
                                            className="btn-close position-absolute end-0 me-3"
                                            onClick={() => setShowModal(false)}
                                        />
                                    </div>

                                    <div className="modal-body pt-2">
                                        <div className="row">
                                            {sortedTeams.map(team => (
                                                <div className="col-12 col-md-6" key={team.id}>
                                                    <div className="border rounded p-3 mb-4 h-100">
                                                        <div className="text-center mb-3">
                                                            <img
                                                                src={team.team.logo}
                                                                alt={team.team.displayName}
                                                                className="mb-2"
                                                                style={{ height: 36, width: 36, objectFit: 'contain' }}
                                                            />
                                                            <h6 className="fw-bold mb-0">{team.team.displayName}</h6>
                                                        </div>

                                                        <ul className="list-unstyled d-flex flex-column align-items-center">
                                                            {(team.leaders || []).map((statGroup, index) => {
                                                                const leader = statGroup.leaders?.[0];
                                                                if (!leader) return null;

                                                                return (
                                                                    <li
                                                                        key={index}
                                                                        className="d-flex align-items-center gap-3 text-center mb-3 w-100"
                                                                        style={{
                                                                            padding: '0.5rem',
                                                                            borderBottom: '1px solid #eee'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={leader.athlete?.headshot}
                                                                            alt={leader.athlete?.displayName}
                                                                            style={{
                                                                                width: 50,
                                                                                height: 50,
                                                                                borderRadius: '50%',
                                                                                objectFit: 'cover'
                                                                            }}
                                                                        />
                                                                        <div className="flex-grow-1">
                                                                            <div className="fw-semibold">{leader.athlete?.displayName}</div>
                                                                            <div className="text-muted small">{statGroup.displayName}: {leader.displayValue}</div>
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {showLiveModal && selectedLiveGame && (() => {
                    const competitors = selectedLiveGame?.competitions?.[0]?.competitors;
                    if (!competitors) return null;

                    const sortedTeams = [...competitors].sort((a, b) => (
                        a.homeAway === 'away' ? -1 : 1
                    ));

                    return (
                        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                                <div className="modal-content border-0 shadow-lg">
                                    <div className="modal-header justify-content-between border-0 pb-0">
                                        <h5 className="modal-title fw-bold w-100 text-center">{selectedLiveGame.name}</h5>
                                        <button
                                            type="button"
                                            className="btn-close position-absolute end-0 me-3"
                                            onClick={() => setShowLiveModal(false)}
                                        />
                                    </div>

                                    <div className="modal-body pt-2">
                                        <div className="row">
                                            {sortedTeams.map(team => (
                                                <div className="col-12 col-md-6" key={team.id}>
                                                    <div className="border rounded p-3 mb-4 h-100">
                                                        <div className="text-center mb-3">
                                                            <img
                                                                src={team.team.logo}
                                                                alt={team.team.displayName}
                                                                className="mb-2"
                                                                style={{ height: 36, width: 36, objectFit: 'contain' }}
                                                            />
                                                            <h6 className="fw-bold mb-0">{team.team.displayName}</h6>
                                                            <div className="text-muted">Score: {team.score}</div>
                                                        </div>

                                                        <ul className="list-unstyled d-flex flex-column align-items-center">
                                                            {(team.leaders || []).map((statGroup, index) => {
                                                                const leader = statGroup.leaders?.[0];
                                                                if (!leader) return null;

                                                                return (
                                                                    <li
                                                                        key={index}
                                                                        className="d-flex align-items-center gap-3 text-center mb-3 w-100"
                                                                        style={{
                                                                            padding: '0.5rem',
                                                                            borderBottom: '1px solid #eee'
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={leader.athlete?.headshot}
                                                                            alt={leader.athlete?.displayName}
                                                                            style={{
                                                                                width: 50,
                                                                                height: 50,
                                                                                borderRadius: '50%',
                                                                                objectFit: 'cover'
                                                                            }}
                                                                        />
                                                                        <div className="flex-grow-1">
                                                                            <div className="fw-semibold">{leader.athlete?.displayName}</div>
                                                                            <div className="text-muted small">{statGroup.displayName}: {leader.displayValue}</div>
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {showFinalModal && finalGameSummary && (() => {
                    const teams = finalGameSummary.teams;
                    const players = finalGameSummary.players;

                    return (
                        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                                <div className="modal-content border-0 shadow-lg">
                                    <div className="modal-header border-bottom-0">
                                        <h5 className="modal-title fw-bold w-100 text-center">
                                            {selectedFinalGame.name} – {t('headings.finalBox')}
                                        </h5>

                                        <button
                                            type="button"
                                            className="btn-close position-absolute end-0 me-3"
                                            onClick={() => setShowFinalModal(false)}
                                        />
                                    </div>
                                    <div className="modal-body pt-0" style={{ maxHeight: 'fit-content', overflowY: 'auto' }}>
                                        {players.map((teamGroup, i) => (
                                            <div key={i} className="mb-4">
                                                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                    <img
                                                        src={teamGroup.team?.logo}
                                                        alt={teamGroup.team?.displayName}
                                                        style={{ height: 28, width: 28, objectFit: 'contain' }}
                                                    />
                                                    <h6 className="fw-bold mb-0">{teamGroup.team?.displayName}</h6>
                                                </div>

                                                {teamGroup.statistics.map((group, j) => (
                                                    <div key={j} className="mb-3">
                                                        {group.name && (
                                                            <div className="text-muted fw-semibold mb-2 text-center" style={{ fontSize: '0.9rem' }}>
                                                                {group.name.charAt(0).toUpperCase() + group.name.slice(1)}
                                                            </div>
                                                        )}


                                                        <div className="table-responsive border rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                            <table className="table table-sm table-striped table-hover text-center mb-0">
                                                                <thead className="table-light sticky-top small">
                                                                    <tr>
                                                                        <th className="text-start">{t('modals.player')}</th>
                                                                        {group.labels.map((label, index) => (
                                                                            <th key={index} className="text-nowrap">{label}</th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {group.athletes.map((athleteData, k) => (
                                                                        <tr key={k}>
                                                                            <td className="text-start">{athleteData.athlete?.displayName}</td>
                                                                            {athleteData.stats.map((stat, sIdx) => (
                                                                                <td key={sIdx}>{stat}</td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}


            </div>
        </div>
    );
}