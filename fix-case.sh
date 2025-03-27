#!/bin/bash

# Base directory
cd frontend/src || exit 1

# File renames
declare -A files=(
  ["components/navbar.jsx"]="components/Navbar.jsx"
  ["pages/Signup.jsx"]="pages/Signup.jsx"
  ["pages/Login.jsx"]="pages/Login.jsx"
  ["pages/Dashboard.jsx"]="pages/Dashboard.jsx"
  ["pages/roster.jsx"]="pages/Roster.jsx"
  ["pages/matchups.jsx"]="pages/Matchups.jsx"
  ["pages/rankings.jsx"]="pages/Rankings.jsx"
  ["pages/draft.jsx"]="pages/Draft.jsx"
  ["pages/portal.jsx"]="pages/Portal.jsx"
  ["pages/leagues.jsx"]="pages/Leagues.jsx"
  ["pages/League/home.jsx"]="pages/League/Home.jsx"
  ["pages/League/settings.jsx"]="pages/League/Settings.jsx"
  ["pages/League/members.jsx"]="pages/League/Members.jsx"
  ["pages/League/rosters.jsx"]="pages/League/Rosters.jsx"
  ["pages/League/schedule.jsx"]="pages/League/Schedule.jsx"
)

for src in "${!files[@]}"; do
  dst=${files[$src]}
  if [[ -f $src ]]; then
    echo "Renaming $src → $dst"
    git mv "$src" "$dst"
  fi
done

echo "Done. Now run:"
echo "  git add -A"
echo "  git commit -m 'Fix file casing to match imports'"
echo "  git push origin main"
