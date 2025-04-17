import asyncio
import aiohttp
import requests

BASE_URL = "https://sports.core.api.espn.com/v3/sports"

def get_players_stats(sport, league):
    url = f"{BASE_URL}/{sport}/{league}/athletes?limit=20000&active=true"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
    
    data = response.json()
    players = []
    for item in data.get("items", []):
        player_info = {
            "id": item.get("id"),
            "name": item.get("displayName"),
            "first_name": item.get("firstName"),
            "last_name": item.get("lastName"),
            "position": item.get("position"),
            "team_name": item.get("team", {}).get("displayName"),
            "stats": item.get("stats", {}),
            "active": item.get("active")
        }
        players.append(player_info)
    return players

# Async version to batch player detail requests
async def fetch_player_detail(session, sport, league, player):
    if not player.get("active"):
        return None
    player_id = player.get("id")
    url = f"https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{player_id}"
    async with session.get(url) as response:
        if response.status != 200:
            print(f"Failed for player {player_id}")
            return None
        return await response.json()

async def batch_fetch_player_details(sport, league, players, batch_size=50):
    details = []
    connector = aiohttp.TCPConnector(limit=batch_size)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_player_detail(session, sport, league, player) for player in players if player.get("active")]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, dict):
                result = result.get("athlete")
                player = {
                    "id": result.get("id"),
                    "name": result.get("displayName"),
                    "position": result.get("position", {}).get("abbreviation"),
                    "last_name": result.get("lastName"),
                    "team": result.get("team", {}).get("displayName"),
                    "first_name": result.get("firstName"),
                    "team_abbrev": result.get("team", {}).get("abbreviation"),
                    "stats": result.get("stats", {}),
                    "active": result.get("active")
                }
                details.append(player)
    return details

def get_all_player_details(sport, league, players, batch_size=50):
    return asyncio.run(batch_fetch_player_details(sport, league, players, batch_size=batch_size))

def return_all_player_details(sport, league):
    players = get_players_stats(sport, league)
    all_details = get_all_player_details(sport, league, players)
    return all_details



