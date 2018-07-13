const express = require('express');
const router = express.Router();

const http = require('http');
const XmlStream = require('xml-stream');
const fs = require('fs');
const config = require('../config/translation.json');

const FILENAME = "public/epg.xml";

function applyChanges(value) {

  let result = value;

  for (replace of config.rules.replaces) {
    result = result.replace(replace.key, replace.value);
  }

  return result;
}

router.get('/', function (req, res, next) {

  res.type('application/xml');

  let url = req.query.url;

  if (!url) {
    res.sendStatus(500);
  }

  var request = http.get(url).on('response', function (response) {

    var stream = fs.createWriteStream(FILENAME);

    response.setEncoding('utf8');
    var xml = new XmlStream(response);

    xml.on('updateElement: programme', function(programme) {
      programme.$.channel = applyChanges(programme.$.channel);
    });

    xml.on('updateElement: channel', function (channel) {
      channel.$.id = applyChanges(channel.$.id);
    });

    xml.on('text: channel > display-name', function (element) {
      //element.$text = applyChanges(element.$text);
      console.log("Processing element: " + element.$text);
    });

    xml.on('data', function (data) {
      stream.write(data);
    });

    xml.on('end', function () {
      stream.end();
      fs.createReadStream(FILENAME).pipe(res);
      console.log("--- DONE ---");
    })

  });


});

module.exports = router;
