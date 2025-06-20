import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

export default function UpcomingGameCard({ event, onClick }) {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    const gameDate = new Date(event.date);
    const { t } = useTranslation();

    const [startsIn, setStartsIn] = useState("");
    const [countdownColor, setCountdownColor] = useState("text-success");

    const updateCountdown = () => {
        const now = new Date();
        const isToday = gameDate.toDateString() === now.toDateString();

        if (gameDate <= now) {
            setStartsIn(t("upcoming.gameStarting"));
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
                setStartsIn(t("upcoming.startsInHoursMinutes", { hours, minutes }));
            } else if (hours === 1) {
                setStartsIn(t("upcoming.startsInOneHour", { minutes }));
            } else if (minutes > 0) {
                setStartsIn(t("upcoming.startsInMinutesSeconds", { minutes, seconds }));
            } else if (minutes === 0 && seconds > 0) {
                setStartsIn(t("upcoming.startsInSeconds", { seconds }));
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

    function getCroppedLogoUrl(logoUrl, size = 104) {
        const path = new URL(logoUrl).pathname;
        return `https://a.espncdn.com/combiner/i?img=${path}&w=${size}&h=${size}`;
    }

    return (
        <div className="h-100">
            <div
                className="Dashboard-card card p-1 shadow shadow-md bg-teritary bg-gradient"
                style={{ cursor: "pointer" }}
                onClick={() => onClick(event)}
            >
                <div className="d-flex justify-content-center align-items-center my-1" style={{ gap: '0.2rem' }}>
                    {/* Away Team */}
                    <div className="d-flex flex-column align-items-center" style={{ width: '45%' }}>
                        <div className="fs-6">{away?.team?.displayName}</div>
                        <img
                            src={getCroppedLogoUrl(away?.team?.logo)}
                            alt={away?.team?.displayName}
                            className="img-fluid mt-2"
                            style={{ width: '50px' }}
                        />
                    </div>

                    {/* @ Symbol */}
                    <div style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)' }}>
                        {t("symbols.at")}
                    </div>

                    {/* Home Team */}
                    <div className="d-flex flex-column align-items-center" style={{ width: '45%' }}>
                        <div className="fs-6">{home?.team?.displayName}</div>
                        <img
                            src={getCroppedLogoUrl(home?.team?.logo)}
                            alt={home?.team?.displayName}
                            className="img-fluid mt-2"
                            style={{ width: '50px' }}
                        />
                    </div>
                </div>

                {startsIn && (
                    <p className={`text-center fs-6 small my-1 ${countdownColor}`}>
                        {startsIn}
                    </p>
                )}

                {showDate && (
                    <p className="text-center fs-6 small my-1 text-muted">
                        {formattedDate}
                    </p>
                )}
            </div>
        </div>
    );
}
