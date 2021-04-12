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

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerDetails = `
    SELECT 
      * 
    FROM 
      player_details;`;
  const playerArray = await database.all(getPlayerDetails);
  response.send(
    playerArray.map((eachPlayer) => {
      convertDbObjectToResponseObject(eachPlayer);
    })
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT
      * 
    FROM
      player_details
    WHERE 
      player_id = ${playerId};`;
  const playerArray = await database.get(getPlayer);
  response.send(convertDbObjectToResponseObject(playerArray));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE
      player_details
    SET
      player_name = "${playerName}"
    WHERE 
      player_id = ${playerId};`;
  await database.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT
      *
    FROM
      match_details
    WHERE
      match_id = ${matchId};`;
  const matchObject = await database.get(getMatch);
  response.send(convertMatchObjectToResponseObject(matchObject));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT 
      *
    FROM 
      player_match_score NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatchArray = await database.all(getPlayerMatches);
  response.send(
    playerMatchArray.map((eachMatch) => {
      convertMatchObjectToResponseObject(eachMatch);
    })
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT 
      * 
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) => {
      convertDbObjectToResponseObject(eachPlayer);
    })
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `
    SELECT 
      player_id, player_name, SUM(score), SUM(fours), SUM(sixes)
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playerScoreArray = await database.get(getPlayerScore);
  response.send({
    playerId: playerScoreArray["player_id"],
    playerName: playerScoreArray["player_name"],
    totalScore: playerScoreArray["SUM(score)"],
    totalFours: playerScoreArray["SUM(fours)"],
    totalSixes: playerScoreArray["SUM(sixes)"],
  });
});

module.exports = app;
