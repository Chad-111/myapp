import asyncio
import aiohttp
import requests
import datetime
import json
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

def get_season_start_end_date(year, sport, league):
    url = f"https://sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}/seasons/{year}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
    data = response.json()

    return {"start_date" : data.get("type").get("startDate"), "end_date" : data.get("type").get("endDate")}

def get_week_number(year, sport, league):
    start_date, end_date = get_season_start_end_date(year, sport, league).values()
    start_date = datetime.datetime.strptime(start_date, "%Y-%m-%dT%H:%MZ")
    end_date = datetime.datetime.strptime(end_date, "%Y-%m-%dT%H:%MZ")
    start_tuesday = start_date + datetime.timedelta(days=((1 - start_date.weekday()) % 7 - 7))
    current_date = datetime.datetime.now()
    if start_date <= current_date <= end_date:
        week_number = (current_date - start_tuesday).days // 7 + 1
        return week_number
    else:
        return None

def get_daily_games(sport : str, league : str):
    BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/"
    url = BASE_URL + f"{sport}/{league}/scoreboard?dates={(datetime.datetime.now()-datetime.timedelta(hours=5)).strftime('%Y%m%d')}-{(datetime.datetime.now()-datetime.timedelta(hours=5)).strftime('%Y%m%d')}"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
    ids = []
    for item in response.json().get('events'):
        ids.append(item.get('id'))
    
    return ids

def get_daily_stats(sport : str, league : str):
    daily_ids = get_daily_games(sport, league)
    if not daily_ids:
        return
    
    
    for game_id in daily_ids:

        
        if sport == "hockey":
            url = f"https://site.web.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary?event={game_id}"
        else:
            url = f"https://cdn.espn.com/core/{league}/boxscore?xhr=1&gameId={game_id}"
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        }
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
        

        data = response.json()
        if not data:
            raise Exception("No data found in response.")
        
        
        # Should run between midnight and 7 am CST (5 am and noon UTC)
        today = (datetime.datetime.now() - datetime.timedelta(hours=12)).strftime('%Y%m%d')
        total_stats = {"date": today, "sport": sport, "stats": []}
        # implementation finished
        if sport == "baseball":
            # data manipulation (boooo)
            athletes = [item.get("statistics") for item in data.get("gamepackageJSON").get("boxscore").get("players")]
            batting = []
            pitching = []
            # get index of batting stats (idk if this is random but this probably is the best way to do it)
            hit_index = athletes[0][0].get("names").index("H")
            hr_index = athletes[0][0].get("names").index("HR")
            rbi_index = athletes[0][0].get("names").index("RBI")
            run_index = athletes[0][0].get("names").index("R")
            walk_index = athletes[0][0].get("names").index("BB")
            strikeout_index = athletes[0][0].get("names").index("K")
            batting_stat_list = [hit_index, hr_index, rbi_index, run_index, walk_index, strikeout_index]

            # get index of pitching stats
            ip_index = athletes[0][1].get("names").index("IP")
            er_index = athletes[0][1].get("names").index("ER")
            k_index = athletes[0][1].get("names").index("K")

            pitching_stat_list = [ip_index, er_index, k_index]

            for item in athletes:
                batting.extend(item[0].get("athletes"))
                pitching.extend(item[1].get("athletes"))
            
            for item in batting:
                # find stolen bases and caught stealing

                last_name = item.get("athlete").get("displayName").split(" ")[-1]
                player_id = item.get("athlete").get("id")
                hits, home_runs, rbis, runs, walks, strikeouts = [item.get("stats")[i] for i in batting_stat_list]
                stolen_bases, caught_stealing = 0, 0
                # given player id: (awful way to do this, but whatever)
                for event in data.get("gamepackageJSON").get("plays"):
                    # this does not see if a person steals home, that's something we can handle later lol
                    # I LOVE INLINE FOR LOOPS (i am going insane)
                    if event.get("type").get("abbreviation") == "SB" and player_id in [participant.get("athlete").get("id") for participant in event.get("participants") if participant.get("type") == "onSecond" or participant.get("type") == "onThird"]:
                        stolen_bases += 1
                    if event.get("type").get("abbreviation") == "CS" and last_name in event.get("text"):
                        caught_stealing += 1

                # IMPORTANT: when accessing, use get() method with default value of 0, otherwise it will throw an error if the key does not exist
                total_stats["stats"].append({"player_id": player_id, "runs": runs, "hits": hits, "home_runs": home_runs, "rbis": rbis, "walks": walks, "strikeouts": strikeouts, "stolen_bases": stolen_bases, "caught_stealing": caught_stealing})

            for item in pitching:
                last_name = item.get("athlete").get("displayName").split(" ")[-1]
                player_id = item.get("athlete").get("id")
                innings_pitched, earned_runs, pitching_strikeouts = [item.get("stats")[i] for i in pitching_stat_list]
                wins = 1 if "W" in item.get("notes", [{}])[0].get("text", "") else 0
                quality_starts = 1 if float(innings_pitched) >= 6 and int(earned_runs) <= 3 else 0
                saves = 1 if "S" in item.get("notes", [{}])[0].get("text", "") else 0
                
                # same warning as above
                total_stats["stats"].append({"player_id": player_id, "wins": wins, "quality_starts": quality_starts, "saves": saves, "innings_pitched": innings_pitched, "earned_runs": earned_runs, "pitching_strikeouts": pitching_strikeouts})

        # implementation finished
        elif sport == "hockey":

            print(f"Processing game ID: {game_id}")
            print(f"Response status: {response.status_code}")
            print(f"Response data structure: {type(data)}")
            print(f"Keys in response: {data.keys()}")

            if "boxscore" in data:
                print("Boxscore found in data")
                print(f"Keys in boxscore: {data['boxscore'].keys() if data['boxscore'] else 'None'}")
            else:
                print("No boxscore in data")
            
            print(today)
            if "players" in data.get("boxscore", {}):
                print("Players found in boxscore")
                forwards = []
                defense = []
                goalies = []
                # get index of stats
                goal_index = data.get("boxscore").get("players")[0].get("statistics")[0].get("keys").index("goals")
                assist_index = data.get("boxscore").get("players")[0].get("statistics")[0].get("keys").index("assists")
                plus_minus_index = data.get("boxscore").get("players")[0].get("statistics")[0].get("keys").index("plusMinus")
                shots_index = data.get("boxscore").get("players")[0].get("statistics")[0].get("keys").index("shotsTotal")
                hit_index = data.get("boxscore").get("players")[0].get("statistics")[0].get("keys").index("hits")
                block_index = data.get("boxscore").get("players")[0].get("statistics")[0].get("keys").index("blockedShots")    
                fw_def_index_list = [goal_index, assist_index, plus_minus_index, shots_index, hit_index, block_index]


                # get index of goalie stats
                saves_index = data.get("boxscore").get("players")[0].get("statistics")[2].get("keys").index("saves")
                goals_against_index = data.get("boxscore").get("players")[0].get("statistics")[2].get("keys").index("goalsAgainst")
                # power play points calculated via events
                power_play_points = {}
                short_handed_points = {}
                events = requests.get(f"https://sports.core.api.espn.com/v2/sports/hockey/leagues/nhl/events/{game_id}/competitions/{game_id}/plays?limit=500")
                events = events.json().get("items")
                for event in events:
                    if event.get("scoringPlay") and event.get("strength",{}).get("abbreviation","") == "power-play":
                        participants = [p.get("playerId") for p in event.get("participants")]
                        for player_id in participants:
                            power_play_points[str(player_id)] = power_play_points.get(str(player_id), 0) + 1
                    if event.get("scoringPlay") and event.get("strength",{}).get("text","") == "Shorthanded":
                        participants = [p.get("playerId") for p in event.get("participants")]
                        for player_id in participants:
                            short_handed_points[str(player_id)] = short_handed_points.get(str(player_id), 0) + 1
                
                athletes = data.get("boxscore").get("players")
                for item in athletes:
                    forwards.extend(item.get("statistics")[0].get("athletes"))
                    defense.extend(item.get("statistics")[1].get("athletes"))
                    goalies.extend(item.get("statistics")[2].get("athletes"))
                
                for item in forwards:
                    player_id = item.get("athlete").get("id")
                    goals, assists, plus_minus, shots, hits, blocks = [item.get("stats")[i] for i in fw_def_index_list]
                    pp_points = power_play_points.get(str(player_id), 0)
                    sh_points = short_handed_points.get(str(player_id), 0)
                
                    total_stats["stats"].append({"player_id": player_id, "goals": goals, "assists": assists, "plus_minus": plus_minus, "shots_on_goal": shots, "hits": hits, "blocks": blocks, "power_play_points": pp_points, "short_handed_points": sh_points})

                for item in defense:
                    player_id = item.get("athlete").get("id")
                    goals, assists, plus_minus, shots, hits, blocks = [item.get("stats")[i] for i in fw_def_index_list]
                    pp_points = power_play_points.get(str(player_id), 0)
                    sh_points = short_handed_points.get(str(player_id), 0)

                    total_stats["stats"].append({"player_id": player_id, "goals": goals, "assists": assists, "plus_minus": plus_minus, "shots_on_goal": shots, "hits": hits, "blocks": blocks, "power_play_points": pp_points, "short_handed_points": sh_points})
                
                for item in goalies:
                    player_id = item.get("athlete").get("id")
                    saves, goals_against = [item.get("stats")[i] for i in [saves_index, goals_against_index]]
                    shutouts = 1 if goals_against == "0" else 0
                    total_stats["stats"].append({"player_id": player_id, "saves": saves, "goals_against": goals_against, "shutouts": shutouts})
            
        # implementation finished
        elif sport == "basketball":
            # should be similar to baseball, but with different stats
            items = data.get("gamepackageJSON").get("boxscore").get("players")
            athletes = []
            for item in items:
                athletes.extend(item.get("statistics")[0].get("athletes"))
            
            # get index of stats
            points_index = items[0].get("statistics")[0].get("keys").index("points")
            rebounds_index = items[0].get("statistics")[0].get("keys").index("rebounds")
            assists_index = items[0].get("statistics")[0].get("keys").index("assists")
            steals_index = items[0].get("statistics")[0].get("keys").index("steals")
            blocks_index = items[0].get("statistics")[0].get("keys").index("blocks")
            turnovers_index = items[0].get("statistics")[0].get("keys").index("turnovers")
            three_point_index = items[0].get("statistics")[0].get("keys").index("threePointFieldGoalsMade-threePointFieldGoalsAttempted")


            stat_index = [points_index, rebounds_index, assists_index, steals_index, blocks_index, turnovers_index, three_point_index]

            for item in athletes:
                player_id = item.get("athlete").get("id")
                print(stat_index)
                try:
                    points, rebounds, assists, steals, blocks, turnovers, three_point_field_goals = [item.get("stats")[i] for i in stat_index]
                    three_point_made, _ = three_point_field_goals.split("-")

                    total_stats["stats"].append({"player_id": player_id, "points": points, "rebounds": rebounds, "assists": assists, "steals": steals, "blocks": blocks, "turnovers": turnovers, "three_pointers": three_point_made, "double_doubles": 1 if int(rebounds) >= 10 and int(points) >= 10 else 0, "triple_doubles": 1 if int(rebounds) >= 10 and int(points) >= 10 and int(assists) >= 10 else 0})
        
                except IndexError as e:
                    print(f"IndexError: {e} for player {player_id}")                

        # implementation TODO
        elif sport == "football": 
            # this is going to suck, but there's no football on lol
            # so we can just do this later
            pass

        else:
            raise Exception("Invalid sport specified.")
        
    return total_stats


if __name__ == "__main__":
    print(get_daily_stats("hockey", "nhl"))
