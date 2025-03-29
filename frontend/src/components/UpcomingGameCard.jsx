// components/UpcomingGameCard.jsx
import React from "react";

export default function UpcomingGameCard({ event }) {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    const odds = comp?.odds?.[0];

    return (
        <div className="mb-4">
            <div className="card w-100 h-100 p-3 d-flex flex-column justify-content-between shadow bg-teritary bg-gradient">
                <div className="d-flex justify-content-center align-items-center my-2">
                    <div className="col-5 d-flex flex-column  align-items-center">
                        <span className="fs-5">{home?.team?.displayName}</span>
                        <img src={home?.team?.logo} alt={home?.team?.displayName} style={{ maxWidth: '4rem' }} />
                    </div>
                    <div className="row align-items-center">
                        <div>
                            <span className="fw-bold">@</span>
                        </div>
                    </div>
                    <div className="col-5 d-flex flex-column  align-items-center">
                        <span className="fs-5">{away?.team?.displayName}</span>
                        <img class="justify-content-center" src={away?.team?.logo} alt={away?.team?.displayName} style={{ maxWidth: '4rem' }} />
                    </div>
                </div>
                {/* <div className="d-flex justify-content-center align-items-center my-2">
                        <img src={away?.team?.logo} alt={away?.team?.displayName} style={{ maxWidth: '4rem' }} />
                        <span className="fs-5 text-center">{away?.team?.displayName}</span>
                        <span className="fw-bold">@</span>
                        <img src={home?.team?.logo} alt={home?.team?.displayName} style={{ maxWidth: '4rem' }} />
                        <span className="fs-5 text-center">{home?.team?.displayName}</span>

                        <span className="fw-bold">@</span>
                        <img src={home?.team?.logo} alt={home?.team?.displayName} style={{ maxWidth: '4rem' }} />
                    </div> */}
                <p className="text-center">{event.date && new Date(event.date).toLocaleString()}</p>
            </div>
            {
                odds && (
                    <div className="card-footer text-muted text-center">
                        <div className="fw-semibold">{odds.details}</div>
                        <small>Odds by <span className="fw-bold">{odds.provider?.name}</span></small>
                    </div>
                )
            }
        </div >
    );
}
