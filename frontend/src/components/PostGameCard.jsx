import React from "react";
import { useTranslation } from "react-i18next";

export default function PostGameCard({ event, onClick }) {
    const { t } = useTranslation();
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');

    return (
        <div
            className="w-100 mb-3 p-2 border rounded shadow-sm bg-secondary-subtle bg-gradient"
            style={{ cursor: "pointer" }}
            onClick={() => onClick(event)}
        >
            <div className="d-flex justify-content-between align-items-center mb-2">
                <img src={away?.team?.logo} alt={away?.team?.displayName} style={{ height: '24px', width: '24px' }} />
                <span className="ms-1 me-auto">{away?.team?.displayName}</span>
                <strong>{away?.score}</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <img src={home?.team?.logo} alt={home?.team?.displayName} style={{ height: '24px', width: '24px' }} />
                <span className="ms-1 me-auto">{home?.team?.displayName}</span>
                <strong>{home?.score}</strong>
            </div>
        </div>
    );
}
