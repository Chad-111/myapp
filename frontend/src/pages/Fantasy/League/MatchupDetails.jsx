// MatchupDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuthToken } from '../../../components/utils/auth';
import { useTranslation } from 'react-i18next';


const MatchupDetails = () => {
  const { matchupId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchup, setMatchup] = useState(null);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchMatchupDetails = async () => {
      const authToken = getAuthToken();
      try {
        const response = await fetch(`/api/matchup/details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + authToken
          },
          body: JSON.stringify({ matchup_code: matchupId })
        });
        const data = await response.json();
        if (response.ok) {
          setMatchup(data.matchup);
          setHomePlayers(data.home_players);
          setAwayPlayers(data.away_players);
        } else {
          setError(data.error || 'Failed to load matchup details.');
        }
        console.log(data);
      } catch (err) {
        setError('Error fetching matchup details.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchupDetails();
  }, [matchupId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      {console.log(matchup)}
      <div>
        <h1>{t('matchup.title')}</h1>
        <h2>{t('matchup.week', { week: matchup.week })}</h2>
        <h3>{matchup.home_team} {t('matchup.vs')} {matchup.away_team}</h3>
        <p><strong>{t('matchup.score')}:</strong> {matchup.home_score} - {matchup.away_score}</p>

        <div className="row">
          <div className="col-md-6">
            <h4>{matchup.home_team} {t('matchup.players')}</h4>
            <ul>
              {homePlayers.map((p, i) => (
                <li key={i}>{p.name} — {p.points.toFixed(2)} pts</li>
              ))}
            </ul>
          </div>

          <div className="col-md-6">
            <h4>{matchup.away_team} {t('matchup.players')}</h4>
            <ul>
              {awayPlayers.map((p, i) => (
                <li>{p.name} — {p.points.toFixed(2)} {t('matchup.pts')}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchupDetails;
