export function formatGamePeriod(leagueSlug, period, clock) {
  switch (leagueSlug) {
    case "nba":
    case "ncaab":
    case "ncaa_mbb":
      return `${clock} - Q${period}`;
    case "nfl":
    case "college-football":
      return `${clock} - ${ordinal(period)} Quarter`;
    case "mlb":
      return `${period % 2 ? "Top" : "Bottom"} ${Math.ceil(period / 2)} Inning`;
    case "nhl":
      return `${clock} - ${ordinal(period)} Period`;
    default:
      return `${clock} - Period ${period}`;
  }
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
