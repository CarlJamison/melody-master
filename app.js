require('dotenv').config()
const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = process.env.PORT || 80;

app.use(express.static(__dirname + '/public'));
const SpotifyWebApi = require('spotify-web-api-node');

var searches = [];

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

app.get('/tracks/:query', async (req, res) => {
  var query = req.params.query.toLowerCase();
  
  console.log(query);
  if(searches[query]){
    
    console.log("Using cached search");
    res.send(searches[query]);
  }else{
    console.log("Requesting from spotify");
      
    await spotifyApi.clientCredentialsGrant().then(
      data => spotifyApi.setAccessToken(data.body['access_token']),
      err => console.log('Something went wrong!', err)
    );

    var allTracks = [];
    var promises = [];

    for(var i = 0; i < 20; i++){
      promises.push(spotifyApi.searchTracks(req.params.query, { limit: 50, offset: i * 50}).then(
        data => {
          var tracks = data.body.tracks.items
            .filter(t => t.preview_url && !t.explicit && t.popularity > 20 &&
              (!query.includes("artist") || t.artists.some(a => a.name.toLowerCase() == query.split(":")[1])))
            .map(t => ({ id: t.id, name: t.name, preview: t.preview_url, popularity: t.popularity}))
          allTracks.push(...tracks)
        },
        err => console.log(err)))
    }
  
    Promise.all(promises).then(() => {
      searches[query] = allTracks;
      res.send(allTracks);
    })
  }

});


server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

//allTracks.sort((a, b) => b.popularity - a.popularity);
