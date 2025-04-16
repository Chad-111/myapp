// components/UpcomingGameCard.jsx
import React, { useEffect, useState } from "react";


export default function UpcomingGameCard({ event, onClick }) {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    const odds = comp?.odds?.[0];
    const gameDate = new Date(event.date);

    const [startsIn, setStartsIn] = useState("");
    const [countdownColor, setCountdownColor] = useState("text-success");

    const updateCountdown = () => {
        const now = new Date();
        const isToday = gameDate.toDateString() === now.toDateString();

        if (gameDate <= now) {
            setStartsIn("Game is starting!");
            setCountdownColor("text-danger");
            return;
        }

        if (isToday) {
            const diffMs = gameDate - now;
            const diffMins = Math.floor(diffMs / 60000);
            const hours = Math.floor(diffMins / 60);
            const minutes = diffMins % 60;
            const seconds = Math.floor((diffMs % 60000) / 1000);

            if (hours > 1) {
                setStartsIn(`Starts in: ${hours}h ${minutes}m`);
            } else if (hours === 1) {
                setStartsIn(`Starts in: 1h ${minutes}m`);
            } else if (minutes > 0) {
                setStartsIn(`Starts in: ${minutes}m ${seconds}s`);
            } else if (minutes === 0 && seconds > 0) {
                setStartsIn(`Starts in: ${seconds}s`);
            }

            if (diffMins <= 5) setCountdownColor("text-danger");
            else if (diffMins <= 30) setCountdownColor("text-warning");
            else setCountdownColor("text-success");
        } else {
            setStartsIn("");
        }
    };



    useEffect(() => {
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const isToday = gameDate.toDateString() === new Date().toDateString();
    const showDate = !isToday;
    const formattedDate = gameDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });


    return (
        <div className="h-100">
            <div
                className="card p-2 shadow shadow-md bg-teritary bg-gradient"
                style={{ cursor: "pointer" }}
                onClick={() => onClick(event)}
            >
                <div
                    className="d-flex justify-content-center align-items-center my-3"
                    style={{ gap: '1rem' }}
                >
                    {/* Away Team */}
                    <div
                        className="d-flex flex-column align-items-center"
                        style={{ width: '45%' }} // equal fixed width
                    >
                        <div className="fw-semibold text-center" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                            {away?.team?.displayName}
                        </div>
                        <img
                            src={away?.team?.logo}
                            alt={away?.team?.displayName}
                            className="img-fluid mt-2"
                            style={{
                                // height: 'clamp(50px, 8vw, 60px)',
                                // width: 'clamp(50px, 8vw, 60px)',
                                // objectFit: 'contain',
                                // aspectRatio: '1 / 1'
                                height: '10vh',
                                width: '10vh',
                                objectFit: 'scale-down'
                            }}
                        />
                    </div>

                    {/* @ Symbol */}
                    <div style={{ fontSize: 'clamp(12px, 1.5vw, 16px)', fontWeight: 100 }}>@</div>

                    {/* Home Team */}
                    <div
                        className="d-flex flex-column align-items-center"
                        style={{ width: '45%' }} // exact same fixed width
                    >
                        <div className="fw-semibold text-center" style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                            {home?.team?.displayName}
                        </div>
                        <img
                            src={home?.team?.logo}
                            alt={home?.team?.displayName}
                            className="img-fluid mt-2"
                            style={{
                                // height: 'clamp(50px, 8vw, 60px)',
                                // width: 'clamp(50px, 8vw, 60px)',
                                // objectFit: 'contain',
                                // aspectRatio: '1 / 1'
                                height: '10vh',
                                width: '10vh',
                                objectFit: 'scale-down'
                            }}
                        />
                    </div>
                </div>
                {startsIn && (
                    <p className={`text-center fw-semibold fs-6 small my-1 ${countdownColor}`}>
                        {startsIn}
                    </p>
                )}
                {showDate && (
                    <p className="text-center text-muted small mb-1 fw-bold">
                        {formattedDate}
                    </p>
                )}
            </div>
        </div>
    );
}