// #################################################################
// Class definition

// ***** Setup ******
var Music = {
};

// ################

Music.Artist = Class.create();
Music.Artist.extend(JSDBI);
Music.Artist.prototype = (new JSDBI()).extend( {
    initialize: function () {
    },
});

// basic class setup
Music.Artist.fields(['artistid', 'name']);
Music.Artist.url('http://home.scottyallen.com/jsdbi/Music/script/music_cgi.cgi/rest/artist');
Music.Artist.elementTag('artist'); //optional

// #################################################################
// Tests

document.write("**Insert**");
document.write("<br/>");
var artist = Music.Artist.insert({name: 'Billy'});
var artistid = artist.id();
document.write("name: "+artist.name());
document.write("<br/>");
document.write("artistid: "+artist.artistid());
document.write("<br/>");
document.write("id: "+artist.id());
document.write("<br/>");
document.write("paramList: "+artist.__getParams());
document.write("<br/>");

document.write("**Retrieve**");
document.write("<br/>");
artist = Music.Artist.retrieve(artistid);
document.write("name: "+artist.name());
document.write("<br/>");
document.write("artistid: "+artist.artistid());
document.write("<br/>");
document.write("id: "+artist.id());
document.write("<br/>");
document.write("paramList: "+artist.__getParams());
document.write("<br/>");

artist.name('Fred');
artist.update();
alert("updated");

document.write("**Update**");
document.write("<br/>");
document.write("name: "+artist.name());
document.write("<br/>");
document.write("artistid: "+artist.artistid());
document.write("<br/>");
document.write("id: "+artist.id());
document.write("<br/>");
document.write("paramList: "+artist.__getParams());
document.write("<br/>");

artist = Music.Artist.retrieve(artistid);
document.write("**ReRetrieved**");
document.write("<br/>");
document.write("name: "+artist.name());
document.write("<br/>");
document.write("artistid: "+artist.artistid());
document.write("<br/>");
document.write("id: "+artist.id());
document.write("<br/>");
document.write("paramList: "+artist.__getParams());
document.write("<br/>");

artist.destroy();
document.write("**Deleted**");
