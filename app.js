const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("Server Running at http://localhost:3006/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `select movie_name from movie;`;
  const moviesList = await db.all(getMoviesQuery);
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      movieName: dbObject.movie_name,
    };
  };
  response.send(
    moviesList.map((eachName) => convertDbObjectToResponseObject(eachName))
  );
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `INSERT INTO movie(director_id,movie_name,lead_actor)
   VALUES(${directorId}, '${movieName}', '${leadActor}' );select last_insert_id() from movie;`;
  const dbResponse = await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
SELECT * from movie
WHERE movie_id=${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(movie);
});

app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
  UPDATE
   movie 
  SET 
  director_id:${directorId},
  movie_name:'${movieName}',
  lead_actor:'${leadActor}'
  WHERE movie_id=${movieId};`;
  const dbResponse = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  delete from movie where movie_id=${movieId};`;
  const dbResponse = await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorQuery = `
    select director_id,director_name from director;`;
  const directorsArray = await db.all(getDirectorQuery);
  response.send(
    directorsArray.map((eachName) => convertDbObjectToResponseObject(eachName))
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieNamesQuery = `
  select movie_name from movie where director_id=${directorId};`;
  const movieNameArray = await db.all(getMovieNamesQuery);
  response.send(
    movieNameArray.map((eachMovie) =>
      convertDbObjectToResponseObject(eachMovie)
    )
  );
});

module.exports = app;
