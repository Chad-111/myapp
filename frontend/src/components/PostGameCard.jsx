// components/PostGameCard.jsx
import { responsiveFontSizes } from "@mui/material";
import React from "react";

export default function PostGameCard({ event }) {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');

    return (
        <div className="w-50 mb-3 p-2 border rounded shadow-sm bg-teritary bg-gradient">
            <div className="card-header text-center mb-1">
                <small className="text-muted fw-bold fs-6">FINAL</small>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-1">
                <img src={away?.team?.logo} alt={away?.team?.displayName} style={{ height: '24px', width: '24px' }} />
                <span className="ms-2 me-auto">{away?.team?.displayName}</span>
                <strong>{away?.score}</strong>
            </div>
            <div className="d-flex justify-content-between align-items-center">
                <img src={home?.team?.logo} alt={home?.team?.displayName} style={{ height: '24px', width: '24px' }} />
                <span className="ms-2 me-auto">{home?.team?.displayName}</span>
                <strong>{home?.score}</strong>
            </div>
        </div>
    );
}
