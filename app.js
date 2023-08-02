const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log("error");
    process.exit(1);
  }
};
initializeDbAndServer();
const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    select
    *
    from
    player_details;`;
  const playersArray = await database.all(getPlayerQuery);
  response.send(
    playersArray.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

//2.
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select *
    from
    player_details
    where
    player_id=${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});
//3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    update
        player_details
    set
        player_name="${playerName}"
    where
        player_id=${playerId};`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
//4
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
select
*
from
match_details
where
match_id=${matchId};`;
  const matchDetails = await database.get(matchDetailsQuery);
  response.send(convertMatchDetailsObjectToResponseObject(matchDetails));
});
//5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
select match_id as matchId,
match,
year
from player_match_score
natural join match_details
where
player_id=${playerId};`;
  const playerMatches = await database.all(getPlayerMatchesQuery);
  response.send(playerMatches);
});

//6.
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
	    SELECT
         player_match_score.player_id as playerId,
         player_name as playerName from player_details inner join player_match_score on player_details.player_id=player_match_score.player_id
         where match_id=${matchId};`;
  const getPlayer = await database.all(getMatchPlayersQuery);
  response.send(getPlayer);
});

//7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerScores = await database.get(getPlayerScored);
  response.send(playerScores);
});

module.exports = app;
