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
        <div className="mb-4 h-auto">
            <div
                className="card p-3 shadow bg-teritary bg-gradient"
                style={{ cursor: "pointer" }}
                onClick={() => onClick(event)}
            >
                <div className="row align-items-center justify-content-center my-2">
                    {/* Away Team */}
                    <div className="col-5 text-center d-flex flex-column align-items-center">
                        <div
                            className="fw-semibold"
                            style={{
                                maxWidth: '100%',
                                fontSize: 'clamp(1rem, 1.5vw, 1rem)'
                            }}
                        >
                            {away?.team?.displayName}
                        </div>
                        <div
                            style={{
                                height: 75,
                                width: 75,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <img
                                src={away?.team?.logo}
                                alt={away?.team?.displayName}
                                className="img-fluid"
                                style={{
                                    maxHeight: '100%',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    aspectRatio: '1 / 1'
                                }}
                            />
                        </div>
                    </div>

                    {/* @ Symbol */}
                    <div className="col-1 d-flex align-items-center justify-content-center">
                        <span
                            style={{
                                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                                fontWeight: '600',
                            }}
                        >
                            @
                        </span>
                    </div>

                    {/* Home Team */}
                    <div className="col-5 text-center d-flex flex-column align-items-center">
                        <div
                            className="fw-semibold"
                            style={{
                                maxWidth: '100%',
                                fontSize: 'clamp(1rem, 1.5vw, 1rem)'
                            }}
                        >
                            {home?.team?.displayName}
                        </div>
                        <div
                            style={{
                                height: 75,
                                width: 75,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <img
                                src={home?.team?.logo}
                                alt={home?.team?.displayName}
                                className="img-fluid"
                                style={{
                                    maxHeight: '100%',
                                    maxWidth: '100%',
                                    objectFit: 'contain',
                                    aspectRatio: '1 / 1'
                                }}
                            />
                        </div>
                    </div>
                </div>


                {startsIn && (
                    <p className={`text-center fw-semibold small mb-1 ${countdownColor}`}>
                        {startsIn}
                    </p>
                )}
                {showDate && (
                    <p className="text-center text-muted small mb-1">
                        {formattedDate}
                    </p>
                )}



                {odds && (
                    <div className="card-footer text-muted text-center mt-auto">
                        <div className="fw-semibold">{odds.details}</div>
                    </div>
                )}
            </div>
        </div>
    );
}