import React from 'react';

const Rankings = () => {
    const rankings = [
        { name: 'Alice', score: 95 },
        { name: 'Bob', score: 90 },
        { name: 'Charlie', score: 85 },
    ];

    return (
        <div>
            <h1>Rankings</h1>
            <ul>
                {rankings.map((ranking, index) => (
                    <li key={index}>
                        {index + 1}. {ranking.name} - {ranking.score}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Rankings;