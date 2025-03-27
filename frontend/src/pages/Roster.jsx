import React from 'react';

const Roster = () => {
    const players = [
        { id: 1, name: 'Player 1', position: 'QB' },
        { id: 2, name: 'Player 2', position: 'RB' },
        { id: 3, name: 'Player 3', position: 'WR' },
        { id: 4, name: 'Player 4', position: 'TE' },
        { id: 5, name: 'Player 5', position: 'K' },
    ];

    return (
        <div>
            <h1>Fantasy Draft Roster</h1>
            <ul>
                {players.map(player => (
                    <li key={player.id}>
                        {player.name} - {player.position}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Roster;