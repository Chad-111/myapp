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
            "id": league + item.get("id"),
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
    player_id = player.get("id")[3:]
    url = f"https://site.web.api.espn.com/apis/common/v3/sports/{sport}/{league}/athletes/{player_id}"
    async with session.get(url) as response:
        if response.status != 200:
            print(f"Failed for player {player_id}")
            return None
        return await response.json()

def get_defense_details():
    details = []
    url = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
    teams = response.json().get("sports")[0].get("leagues")[0].get("teams")
    for team in teams:
        player = {
            # Using negative id for defense/special teams
            "id": "nfl" + str(-int(team.get("team").get("id"))),
            "name": f"{team.get("team").get("displayName")} D/ST",
            "first_name": "",
            "last_name": "",
            "position": "DST",
            "team": team.get("team").get("displayName"),
            "team_abbrev": team.get("team").get("abbreviation"),
            "stats": {},
            "active": True,
            "location": team.get("team").get("location"),
            "short_name": team.get("team").get("name"),
        }
        details.append(player)
    return details

# Gets player details, inc. D/ST.
async def batch_fetch_player_details(sport, league, players, batch_size=50):
    if sport == "football":
        # For football, we need to add defense/special teams (D/ST) details
        details = get_defense_details()
    else:
        details = []


    connector = aiohttp.TCPConnector(limit=batch_size)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_player_detail(session, sport, league, player) for player in players if player.get("active")]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for result in results:
            if isinstance(result, dict):
                result = result.get("athlete")
                player = {
                    "id": league + result.get("id"),
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

def get_daily_games(sport : str, league : str, day=datetime.datetime.now()):
    BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/"
    url = BASE_URL + f"{sport}/{league}/scoreboard?dates={(day-datetime.timedelta(hours=12)).strftime('%Y%m%d')}-{(day-datetime.timedelta(hours=12)).strftime('%Y%m%d')}"
    response = requests.get(url)

    if response.status_code != 200:
        raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
    ids = []
    for item in response.json().get('events'):
        ids.append(item.get('id'))
    return ids

def get_daily_stats(sport : str, league : str, day=None):

    def index(lst, value, default=-1):
        try:
            return lst.index(value)
        except ValueError:
            return default
    if day is None:
        daily_ids = get_daily_games(sport, league)
    else:
        print("called")
        daily_ids = get_daily_games(sport, league, day)

    print(daily_ids)
    if not daily_ids:
        return
    
    all_stats = []
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
        total_stats = {"date": today, "sport": sport, "stats": {}, "game_id": game_id}
        # implementation finished
        if sport == "baseball":
            # data manipulation (boooo)
            athletes = [item.get("statistics") for item in data.get("gamepackageJSON").get("boxscore").get("players")]
            batting = []
            pitching = []
            if len(athletes[0][0].get("athletes")) != 0:
                # get index of batting stats (idk if this is random but this probably is the best way to do it)
                
                hit_index = index(athletes[0][0].get("names"), "H")
                hr_index = index(athletes[0][0].get("names"), "HR")
                rbi_index = index(athletes[0][0].get("names"), "RBI")
                walk_index = index(athletes[0][0].get("names"), "BB")
                strikeout_index = index(athletes[0][0].get("names"), "K")
                run_index = index(athletes[0][0].get("names"), "R")
                
                
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
                    player_id = "mlb" + item.get("athlete").get("id")
                    try:
                        hits, home_runs, rbis, runs, walks, strikeouts = [0 if i == -1 else item.get("stats")[i] for i in batting_stat_list]
                        stolen_bases, caught_stealing = 0, 0
                        # given player id: (awful way to do this, but whatever)
                        if data.get("gamepackageJSON").get("plays") is not None:
                            for event in data.get("gamepackageJSON").get("plays"):
                                # this does not see if a person steals home, that's something we can handle later lol
                                # I LOVE INLINE FOR LOOPS (i am going insane)
                                if event.get("type").get("abbreviation") == "SB" and player_id in [participant.get("athlete").get("id") for participant in event.get("participants") if participant.get("type") == "onSecond" or participant.get("type") == "onThird"]:
                                    stolen_bases += 1
                                if event.get("type").get("abbreviation") == "CS" and last_name in event.get("text"):
                                    caught_stealing += 1

                            # IMPORTANT: when accessing, use get() method with default value of 0, otherwise it will throw an error if the key does not exist
                            total_stats["stats"][player_id] = {"runs": int(runs), "hits": int(hits), "home_runs": int(home_runs), "rbis": int(rbis), "walks": int(walks), "strikeouts": int(strikeouts), "stolen_bases": int(stolen_bases), "caught_stealing": int(caught_stealing)}
                    except IndexError as e:
                        print(f"IndexError: {e} for player {player_id}")
                        # Handle the case where the index is not found
                        total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                        total_stats["stats"][player_id]["runs"] = 0
                        total_stats["stats"][player_id]["hits"] = 0
                        total_stats["stats"][player_id]["home_runs"] = 0
                        total_stats["stats"][player_id]["rbis"] = 0
                        total_stats["stats"][player_id]["walks"] = 0
                        total_stats["stats"][player_id]["strikeouts"] = 0
                        total_stats["stats"][player_id]["stolen_bases"] = 0
                        total_stats["stats"][player_id]["caught_stealing"] = 0

                for item in pitching:
                    last_name = item.get("athlete").get("displayName").split(" ")[-1]
                    player_id = "mlb" + item.get("athlete").get("id")
                    try:
                        innings_pitched, earned_runs, pitching_strikeouts = [item.get("stats")[i] for i in pitching_stat_list]
                        if "." in innings_pitched:
                            print(innings_pitched)
                            innings_pitched, partial_out = innings_pitched.split(".")
                            if "-" in innings_pitched:
                                innings_pitched = 0
                            if "-" in partial_out:
                                partial_out = 0
                            innings_pitched = float(innings_pitched) + (float(partial_out) / 3 if partial_out else 0)
                        elif innings_pitched == "--":
                            innings_pitched = 0
                        else:
                            innings_pitched = float(innings_pitched)
                        
                        if earned_runs == "--":
                            earned_runs = 0
                        
                        if pitching_strikeouts == "--":
                            pitching_strikeouts = 0
                        wins = 1 if "W" in item.get("notes", [{}])[0].get("text", "") else 0
                        quality_starts = 1 if float(innings_pitched) >= 6 and int(earned_runs) <= 3 else 0
                        saves = 1 if "S" in item.get("notes", [{}])[0].get("text", "") else 0
                    except IndexError as e:
                        print(f"IndexError: {e} for player {player_id}")
                        # Handle the case where the index is not found
                        innings_pitched, earned_runs, pitching_strikeouts = 0, 0, 0
                        wins, quality_starts, saves = 0, 0, 0
                    
                    # same warning as above
                    total_stats["stats"][player_id] = {"wins": wins, "quality_starts": quality_starts, "saves": saves, "innings_pitched": innings_pitched, "earned_runs": earned_runs, "pitching_strikeouts": pitching_strikeouts}

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
                    player_id = "nhl" + item.get("athlete").get("id")
                    try:
                        goals, assists, plus_minus, shots, hits, blocks = [0 if i == -1 else item.get("stats")[i] for i in fw_def_index_list]
                        pp_points = power_play_points.get(str(player_id), 0)
                        sh_points = short_handed_points.get(str(player_id), 0)
                    
                        total_stats["stats"][player_id] = {"goals": int(goals), "assists": int(assists), "shots_on_goal": int(shots), "hits": int(hits), "blocks": int(blocks), "power_play_points": int(pp_points), "short_handed_points": int(sh_points)}
                    except IndexError as e:
                        print(f"IndexError: {e} for player {player_id}")
                        # Handle the case where the index is not found
                        total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                        total_stats["stats"][player_id]["goals"] = 0
                        total_stats["stats"][player_id]["assists"] = 0
                        total_stats["stats"][player_id]["shots_on_goal"] = 0
                        total_stats["stats"][player_id]["hits"] = 0
                        total_stats["stats"][player_id]["blocks"] = 0
                        total_stats["stats"][player_id]["power_play_points"] = 0
                        total_stats["stats"][player_id]["short_handed_points"] = 0

                for item in defense:
                    player_id = "nhl" + item.get("athlete").get("id")
                    try:
                        goals, assists, plus_minus, shots, hits, blocks = [int(item.get("stats")[i]) for i in fw_def_index_list]
                        pp_points = power_play_points.get(str(player_id), 0)
                        sh_points = short_handed_points.get(str(player_id), 0)

                        total_stats["stats"][player_id] = {"goals": goals, "assists": assists, "shots_on_goal": shots, "hits": hits, "blocks": blocks, "power_play_points": pp_points, "short_handed_points": sh_points}
                    except IndexError as e:
                        print(f"IndexError: {e} for player {player_id}")
                        # Handle the case where the index is not found
                        total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                        total_stats["stats"][player_id]["goals"] = 0
                        total_stats["stats"][player_id]["assists"] = 0
                        total_stats["stats"][player_id]["shots_on_goal"] = 0
                        total_stats["stats"][player_id]["hits"] = 0
                        total_stats["stats"][player_id]["blocks"] = 0
                        total_stats["stats"][player_id]["power_play_points"] = 0
                        total_stats["stats"][player_id]["short_handed_points"] = 0

                    
                for item in goalies:
                    player_id = "nhl" + item.get("athlete").get("id")
                    try:
                        saves, goals_against = [int(item.get("stats")[i]) for i in [saves_index, goals_against_index]]
                        shutouts = 1 if goals_against == "0" else 0
                        total_stats["stats"][player_id] = {"saves": saves, "goals_against": goals_against, "shutouts": shutouts}
                    except IndexError as e:
                        print(f"IndexError: {e} for player {player_id}")
                        # Handle the case where the index is not found
                        total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                        total_stats["stats"][player_id]["saves"] = 0
                        total_stats["stats"][player_id]["goals_against"] = 0
                        total_stats["stats"][player_id]["shutouts"] = 0
                
        # implementation finished
        elif sport == "basketball":
            # should be similar to baseball, but with different stats
            items = data.get("gamepackageJSON").get("boxscore").get("players")
            if items is None:
                print("No players found in boxscore")
                print(data.get("gamepackageJSON").get("boxscore"))
            else:
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
                    player_id = "nba" + item.get("athlete").get("id")
                    print(stat_index)
                    try:
                        points, rebounds, assists, steals, blocks, turnovers, three_point_field_goals = [item.get("stats")[i] for i in stat_index]
                        three_point_made, _ = three_point_field_goals.split("-")

                        total_stats["stats"][player_id] = {"points": int(points), "rebounds": int(rebounds), "assists": int(assists), "steals": int(steals), "blocks": int(blocks), "turnovers": int(turnovers), "three_pointers_made": int(three_point_made), "double_doubles": 1 if int(rebounds) >= 10 and int(points) >= 10 else 0, "triple_doubles": 1 if int(rebounds) >= 10 and int(points) >= 10 and int(assists) >= 10 else 0}
            
                    except IndexError as e:
                        print(f"IndexError: {e} for player {player_id}")                

        # Also have to do the same thing for college football lol
        elif league == "nfl": 
            items = data.get("gamepackageJSON").get("boxscore").get("players")
            passing = []
            rushing = []
            receiving = []
            fumbles = []
            kickers = []
            defense = []

            team_data = data.get("gamepackageJSON").get("boxscore").get("teams")

            

            for item in items:
                passing.extend(item.get("statistics")[0].get("athletes"))
                rushing.extend(item.get("statistics")[1].get("athletes"))
                receiving.extend(item.get("statistics")[2].get("athletes"))
                fumbles.extend(item.get("statistics")[3].get("athletes"))
                kickers.extend(item.get("statistics")[8].get("athletes"))
                defense.extend(item.get("statistics")[4])
            
            # get index of stats
            pass_yd_index = items[0].get("statistics")[0].get("keys").index("passingYards")
            pass_td_index = items[0].get("statistics")[0].get("keys").index("passingTouchdowns")
            int_index = items[0].get("statistics")[0].get("keys").index("interceptions")

            rush_td_index = items[0].get("statistics")[1].get("keys").index("rushingTouchdowns")
            rush_yd_index = items[0].get("statistics")[1].get("keys").index("rushingYards")

            receptions_index = items[0].get("statistics")[2].get("keys").index("receptions")
            rec_yd_index = items[0].get("statistics")[2].get("keys").index("receivingYards")
            rec_td_index = items[0].get("statistics")[2].get("keys").index("receivingTouchdowns")

            fumbles_index = items[0].get("statistics")[3].get("keys").index("fumblesLost")
            def_int_index = items[0].get("statistics")[5].get("keys").index("interceptions")
            def_td_index = items[0].get("statistics")[4].get("keys").index("defensiveTouchdowns")
            sacks_index = items[0].get("statistics")[4].get("keys").index("sacks")

            kr_td_index = items[0].get("statistics")[6].get("keys").index("kickReturnTouchdowns")
            punt_td_index = items[0].get("statistics")[7].get("keys").index("puntReturnTouchdowns")
            # wow this sucks
            url = f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{game_id}/competitions/{game_id}/plays?limit=500"
            
            events = requests.get(url)
            events = events.json().get("items")
            for event in events:
                # defensive blocked kicks (touchdowns should**** be covered by team stats)
                if "Field Goal Good" in event.get("type").get("text"):
                    for participant in event.get("participants"):
                        if participant.get("type") == "scorer":
                            player_id = "nfl" + participant.get("athlete").get("$ref").split("/")[-1].split("?")[0]
                            yards = [int(word) for word in event.get("shortText").split() if word.isdigit()]
                            yards = yards[0] if yards else 0

                            total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})      
                            if yards <= 39:
                                total_stats["stats"][player_id]["fg_made_0_39"] = total_stats["stats"][player_id].get("fg_made_0_39", 0) + 1
                            elif yards <= 49:
                                total_stats["stats"][player_id]["fg_made_40_49"] = total_stats["stats"][player_id].get("fg_made_40_49", 0) + 1
                            else:
                                total_stats["stats"][player_id]["fg_made_50plus"] = total_stats["stats"][player_id].get("fg_made_50plus", 0) + 1
                if "Blocked" in event.get("type").get("text"):
                    ref = event.get("team").get("$ref")
                    data = requests.get(ref).json()
                    player_id = "nfl" + str(-int(data.get("id")))
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["blocked_kicks"] = total_stats["stats"][player_id].get("blocked_kicks", 0) + 1
                
                if "Safety" in event.get("type").get("text"):
                    ref = event.get("team").get("$ref")
                    data = requests.get(ref).json()
                    player_id = "nfl" + str(-int(data.get("id")))
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["safeties"] = total_stats["stats"][player_id].get("safeties", 0) + 1

                if event.get("pointAfterAttempt") and event.get("pointAfterAttempt").get("text") == "Two Point Pass" and event.get("pointAfterAttempt").get("value") == 2:
                    for player in event.get("participants"):
                        if player.get("type") == "patPasser":
                            player_id = player.get("athlete").get("id")
                            total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                            total_stats["stats"][player_id]["passing_2pt"] = total_stats["stats"][player_id].get("passing_2pt", 0) + 1
                        elif player.get("type") == "patScorer":
                            player_id = player.get("athlete").get("id")
                            total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                            total_stats["stats"][player_id]["reveiving_2pt"] = total_stats["stats"][player_id].get("receiving_2pt", 0) + 1
                elif event.get("pointAfterAttempt") and event.get("pointAfterAttempt").get("text") == "Two Point Rush" and event.get("pointAfterAttempt").get("value") == 2:
                    for player in event.get("participants"):
                        if player.get("type") == "patRusher":
                            player_id = player.get("athlete").get("id")
                            total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                            total_stats["stats"][player_id]["rushing_2pt"] = total_stats["stats"][player_id].get("rushing_2pt", 0) + 1
            
            

            for item in passing:
                player_id = "nfl" + item.get("athlete").get("id")
                try:
                    pass_yds, pass_td, ints = [int(item.get("stats")[i]) for i in [pass_yd_index, pass_td_index, int_index]]
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["passing_yds"] = pass_yds
                    total_stats["stats"][player_id]["passing_tds"] = pass_td
                    total_stats["stats"][player_id]["interceptions"] = ints
                except IndexError as e:
                    print(f"IndexError: {e} for player {player_id}")
                    # Handle the case where the index is not found
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["passing_yds"] = 0
                    total_stats["stats"][player_id]["passing_tds"] = 0
                    total_stats["stats"][player_id]["interceptions"] = 0
            
            for item in rushing:
                player_id = "nfl" + item.get("athlete").get("id")
                try:
                    rush_yds, rush_td = [int(item.get("stats")[i]) for i in [rush_yd_index, rush_td_index]]
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["rushing_yds"] = rush_yds
                    total_stats["stats"][player_id]["rushing_tds"] = rush_td
                except IndexError as e:
                    print(f"IndexError: {e} for player {player_id}")
                    # Handle the case where the index is not found
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["rushing_yds"] = 0
                    total_stats["stats"][player_id]["rushing_tds"] = 0
            
            for item in receiving:
                player_id = "nfl" + item.get("athlete").get("id")
                try:
                    rec_yds, rec_td, rec = [int(item.get("stats")[i]) for i in [rec_yd_index, rec_td_index, receptions_index]]
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["receiving_yds"] = rec_yds
                    total_stats["stats"][player_id]["receiving_tds"] = rec_td
                    total_stats["stats"][player_id]["receptions"] = rec
                except IndexError as e:
                    print(f"IndexError: {e} for player {player_id}")
                    # Handle the case where the index is not found
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["receiving_yds"] = 0
                    total_stats["stats"][player_id]["receiving_tds"] = 0
                    total_stats["stats"][player_id]["receptions"] = 0
            
            for item in fumbles:
                player_id = "nfl" + item.get("athlete").get("id")
                try:
                    fumbles_lost = int(item.get("stats")[fumbles_index])
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["fumbles_lost"] = fumbles_lost
                except IndexError as e:
                    print(f"IndexError: {e} for player {player_id}")
                    # Handle the case where the index is not found
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["fumbles_lost"] = 0

            for item in kickers:
                player_id = "nfl" + item.get("athlete").get("id")
                try:
                    field_goals_made, field_goals_attempted = item.get("stats")[0].split("/")
                    extra_points_made, extra_points_attempted = item.get("stats")[3].split("/")
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["fg_missed"] = int(field_goals_attempted) - int(field_goals_made)
                    total_stats["stats"][player_id]["xp_made"] = int(extra_points_made)
                    total_stats["stats"][player_id]["xp_missed"] = int(extra_points_attempted) - int(extra_points_made)
                except IndexError as e:
                    print(f"IndexError: {e} for player {player_id}")
                    # Handle the case where the index is not found
                    total_stats["stats"][player_id] = total_stats["stats"].get(player_id, {})
                    total_stats["stats"][player_id]["fg_missed"] = 0
                    total_stats["stats"][player_id]["xp_made"] = 0
                    total_stats["stats"][player_id]["xp_missed"] = 0

            # each team
            for item in items:
                team_id = -int(item.get("team").get("id"))
                totals = item.get("statistics")[4].get("totals")
                total_stats["stats"][team_id] = total_stats["stats"].get(team_id, {})
                total_stats["stats"][team_id]["sacks"] = int(totals[sacks_index])
                total_stats["stats"][team_id]["defensive_tds"] = int(totals[def_td_index])
                if len(item.get("statistics")[5].get("totals")) > 0:
                    total_stats["stats"][team_id]["interceptions"] = int(item.get("statistics")[5].get("totals")[def_int_index])
                else:
                    total_stats["stats"][team_id]["interceptions"] = 0
                
                if len(item.get("statistics")[6].get("totals")) > 0:
                    kr_total = int(item.get("statistics")[6].get("totals")[kr_td_index])
                else:
                    kr_total = 0

                if len(item.get("statistics")[7].get("totals")) > 0:
                    pr_total = int(item.get("statistics")[7].get("totals")[punt_td_index])
                else:
                    pr_total = 0
                total_stats["stats"][team_id]["kick_return_tds"] = kr_total
                total_stats["stats"][team_id]["punt_return_tds"] = pr_total
            

            # summary data for points allowed
            url = f"https://site.web.api.espn.com/apis/site/v2/sports/football/{league}/summary?event={game_id}"
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                raise Exception(f"Failed to fetch data: {response.status_code} - {response.text}")
            summary_data = response.json()
            home_team_id, away_team_id = -int(summary_data.get("boxscore").get("teams")[1].get("team").get("id")), -int(summary_data.get("boxscore").get("teams")[0].get("team").get("id"))

            home_score, away_score = summary_data.get("scoringPlays")[-1].get("homeScore"), summary_data.get("scoringPlays")[-1].get("awayScore")
            total_stats["stats"][home_team_id] = total_stats["stats"].get(home_team_id, {})
            total_stats["stats"][home_team_id]["points_allowed"] = int(away_score)
            total_stats["stats"][away_team_id] = total_stats["stats"].get(away_team_id, {})
            total_stats["stats"][away_team_id]["points_allowed"] = int(home_score)
            
        # college football
        elif league == "college-football":
            pass # for now: TODO
        else:
            raise Exception("Invalid sport specified.")
        
        all_stats.append(total_stats)
    cleaned_stats = {"sport": sport, "league": league, "today": today, "stats": {}}
    #cleaning, to handle doubleheaders
    for item in all_stats:
        # for all player ids
        for key in item["stats"].keys():
            if key in cleaned_stats["stats"].keys():
                # sum columns that exist in both dictionaries, otherwise add the new key
                for stat_key in item["stats"][key].keys():
                    if stat_key in cleaned_stats["stats"][key].keys():
                        cleaned_stats["stats"][key][stat_key] += item["stats"][key][stat_key]
                    else:
                        cleaned_stats["stats"][key][stat_key] = item["stats"][key][stat_key]
            else:
                cleaned_stats["stats"][key] = item["stats"][key]
    return cleaned_stats



if __name__ == "__main__":
    # testing
    print(get_daily_stats("baseball", "mlb"))   