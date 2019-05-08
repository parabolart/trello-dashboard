'use strict';

var fs = require('fs');
var async = require('async');
var moment = require('moment-timezone');
var math = require('mathjs');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const dotenv = require('dotenv');
dotenv.config();

var output;

var executed = false;

var request = require('request');
//var proxiedRequest = request.defaults({proxy: "http://127.0.0.1:3128"});
var proxiedRequest = request;

var leadTimeUnit = 'days';
var dateFormat = require('dateformat');
var TRELLO_KEY = process.env.TRELLO_KEY;
var TRELLO_TOKEN = process.env.TRELLO_TOKEN;

var trelloIDS = {
  'client': '5c7812a444111f835dd0ca43',
  'bidvalue': '5c7812e25fe9700eb0f72c03',
  'bidsentdate': '5caf8169fb553d1649481657',

  'listemailin': '5c780d8bf8e2634893342172',
  'listprinting': '5c780fdaf1745e5e1ef9ad08', //needs printing
  'listbreakout': '5c780fe10807d615f0de72e6', //estimating
  'listbreaking': '5cb62ec598effd338e398b24',
  'listreview': '5c780fefa7947a5486324c7e', //speed bid
  'listsendbid': '5c780ff410efb72b17454e44',
  'listbidsent': '5c780ff841e6d46153f9ee04',
  'listfollowup': '5c7ef4d6534d873556e56600',
  'listapproval': '5c7810146fd84761af535cef',
  'listkickoff': '5ca38da403ea0f50ead089d5'
};

var shortenString = function(str, len = 50) {
  if (str.length >= len) {
    return str.substring(0, len) + "...";
  } else {
    return str;
  }
}

Object.size = function(obj) {
  var size = 0,
    key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
}

function selectWhere(data, propertyName, property2, type) {
  for (var i = 0; i < data.length; i++) {
    if (data[i][propertyName] == property2) return data[i]['value'][type];
  }
  return null;
}

function constructUrl(url) {
  if (url.indexOf('?') === -1) {
    url = url + '?';
  } else {
    url = url + '&';
  }

  url = url + 'key=' + TRELLO_KEY + '&token=' + TRELLO_TOKEN;
  return url;
}

//io.on('connection', function(socket) {
//  socket.on('chat message', function(msg) {
//    io.emit('chat message', msg);
//  });
//});

function getCardNumbers(req, res, next, io, board) {

    if (!executed) {
      executed = true;

      if (!board) {
        board = '5c780c720a100113beb84b44';
      }

      var idBidSent = trelloIDS['listbidsent'];

      var idEmailIn = trelloIDS['listemailin'];

      var archiveDay = moment().subtract(0, 'days').format("YYYY-MM-DD");

      var localurl = (__dirname + '\\archive\\' + archiveDay + ".json");

      var urlallcards = constructUrl('https://api.trello.com/1/boards/' + board + '/cards/open?fields=id,name,due,idBoard,idList,idLabels,idChecklists,idMembers,dueCompleted&customFieldItems=true&filter=all');

      var urlbid = constructUrl('https://api.trello.com/1/lists/' + idBidSent + '/cards?actions=all&fields=name,closed&customFieldItems=true&filter=all');

      var urlemail = constructUrl('https://api.trello.com/1/lists/' + idEmailIn + '/cards?actions=all&fields=name,closed&customFieldItems=true&filter=all');

      proxiedRequest.get(urlallcards, function(error, response, body) {

        if (error) throw error;

        console.log("₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪ get data from Trello");

        fs.writeFile(localurl, body, function(err) {
          if (err) {
            console.error("write error: " + err);
          }
          console.log("₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪ new file written");
        });
        io.emit('chat message', 'test1');
        processTrelloData2(archiveDay, body, io);

      });

    }

  //try {
  //  if (!fs.existsSync(localurl)) {
  //    proxiedRequest.get(urlallcards, function(error, response, body) {
  //
  //      if (error) throw error;
  //
  //      console.log("get data from Trello, write to local file");
  //
  //      fs.writeFile(localurl, body, function(err) {
  //        if (err) {
  //          console.error(err);
  //        }
  //      });
  //
  //      processTrelloData(archiveDay, body);
  //
  //    });
  //  } else {
  //    fs.readFile(localurl, (error, body) => {
  //
  //      if (error) throw error;
  //
  //      console.log("get data from local archive");
  //
  //      processTrelloData(archiveDay, body);
  //
  //    });
  //  }
  //} catch (err) {
  //  console.error(err);
  //}
}

function processTrelloData2(day, body, io) {


  io.emit('chat message', 'test2');
  var j = 0;
  //var now = moment();
  //now.tz('America/New_York');

  console.info('Response OK');
  io.emit('chat message', 'test2.5');

  var newday = {};
  var readurl = {};
  var count = 0;
  for (var i = 0; i <= 11; i++) {
    newday[i] = moment(day).subtract(i, 'days').format("YYYY-MM-DD");
    if (moment(newday[i]).isoWeekday() !== 6 && moment(newday[i]).isoWeekday() !== 7) {
      console.log(count + '  ' + moment(newday[i]).isoWeekday());
      newday[count] = moment(day).subtract(i, 'days').format("YYYY-MM-DD");
      readurl[count] = (__dirname + '\\archive\\' + newday[count] + ".json");
      //console.log(readurl[count]);
      count++;
    }
  }

  //body = JSON.parse(body);
  //console.log(JSON.stringify(body.length));

  var details = {};
  var card;
  console.log(readurl);

  async.eachSeries(
    // Pass items to iterate over
    [readurl[0], readurl[1], readurl[2], readurl[3], readurl[4], readurl[5], readurl[6]],
    // Pass iterator function that is called for each item
    function(filename, cb) {
      fs.readFile(filename, function(err, content) {
        if (!err) {
          content = JSON.parse(content);
          //do the thing
          console.log(filename);
          details[j] = {};
          details[j][0] = newday[j];
          details[j][1] = true;
          console.log(newday[j]);

          for (var k = 0; k < content.length; k++) {
            card = content[k];

            if (details[j][card.idList] == undefined) {
              details[j][card.idList] = {};
            }

            details[j][card.idList][k] = {
              id: card.id,
              name: card.name
            };
          }
          j++;
        } else {
          details[j] = {};
          details[j][0] = newday[j];
          details[j][1] = false;
          j++;
          console.log(err);
        }

        // Calling cb makes it go to the next item.
        cb(err);
      });
    },
    // Final callback after each item has been iterated over.
    function(err) {
      var result = details; //[ details['5c780d8bf8e2634893342172'].length, details['5c780fdaf1745e5e1ef9ad08'].length, details['5c780fe10807d615f0de72e6'].length, details['5cb62ec598effd338e398b24'].length, details['5c780fefa7947a5486324c7e'].length, details['5c780ff410efb72b17454e44'].length ];
      io.emit('chat message', result); //JSON.stringify(result));
      //result_out(result, io);
      //console.log(JSON.stringify(result));
      console.log('₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪₪ output');
      io.emit('chat message', 'test3');
    }
  );
}

function processTrelloData_old(day, body, io) {

  var now = moment();
  now.tz('America/New_York');

  console.info('Response OK');

  body = JSON.parse(body);
  console.log(JSON.stringify(body.length));

  var details = {};
  var card;
  var newday = {};

  for (var j = 0; j <= 6; j++) {

    //newday[j] = {};
    newday[j] = moment(day).subtract(j, 'days').format("YYYY-MM-DD");

    var readurl = (__dirname + '\\archive\\' + newday[j] + ".json");

    if (fs.existsSync(readurl)) {
      fs.readFile(readurl, function(error, localbody) {
        if (error) {
          console.error("read error: " + error);
        }

        details[j] = {};
        details[j][0] = newday[j];
        details[j][1] = true;

        for (var i = 0; i < localbody.length; i++) {
          card = localbody[i];

          if (details[j][card.idList] == undefined) {
            details[j][card.idList] = {};
          }

          details[j][card.idList][i] = {
            id: card.id,
            name: card.name
          };
        }

      });
    } else {
      details[j] = {};
      details[j][0] = newday[j];
      details[j][1] = true;
    }
  }

  if (details[6][1] == true) {
    var result = details; //[ details['5c780d8bf8e2634893342172'].length, details['5c780fdaf1745e5e1ef9ad08'].length, details['5c780fe10807d615f0de72e6'].length, details['5cb62ec598effd338e398b24'].length, details['5c780fefa7947a5486324c7e'].length, details['5c780ff410efb72b17454e44'].length ];
    io.emit('chat message', result); //JSON.stringify(result));
    console.log('output');
    //console.log(newday + ": " + (Object.size(result[j][0])));
  }

  //res.json(result);

}

function proxiedRequestGet(url, res, next, io) {

  url = constructUrl(url);

  console.info('GET URL => ' + url);

  proxiedRequest.get(url, function(error, response, body) {

    //Always resend same StatusCode as request
    res.statusCode = response.statusCode;

    if (!error && response.statusCode == 200) {
      console.info('Response OK');
      //io.emit('chat message', body.toString());
      res.send(JSON.stringify(body));
    } else {

      //Create custom Error
      var errorToReturn = new Error(body);

      //Set a status property on error (same as response)
      errorToReturn.status = response.statusCode;

      if (error) {
        //Set a message property (error if not null)
        errorToReturn.errorMessage = error.toString();
      } else {
        //Set a message property (body message)
        errorToReturn.errorMessage = body.toString();
      }

      //Pass the error to the next middleware !! EXPRESS POWER !
      next(errorToReturn);
    }
  });
}

function getdateEntryInFirstList(card, idFirstList) {
  //console.log('getdateEntryInFirstList');
  var action;
  var creationDate;
  for (var i = card.actions.length - 1; i >= 0; i--) {
    action = card.actions[i];
    //console.log('action id ' + action.id);
    if (action.type === 'createCard') {
      creationDate = action.date;
      //console.log('creation date = ' + creationDate);
    }
    if (action.type === 'emailCard') {
      creationDate = action.date;
      //console.log('creation date = ' + creationDate);
    }

    if (action.type === 'updateCard') {
      if (action.data !== undefined && action.data.listAfter !== undefined && action.data.listAfter.id === idFirstList) {
        return action.date;
      }

      if (action.data !== undefined && action.data.listBefore !== undefined && action.data.listBefore.id === idFirstList) {
        return creationDate;
      }
    }
  }

  return creationDate;
}

function getdateEntryInLastList(card, idLastList) {
  var action;
  for (var i = 0; i < card.actions.length; i++) {
    action = card.actions[i];
    if (action.type === 'updateCard') {
      if (action.data !== undefined && action.data.listAfter !== undefined && action.data.listAfter.id === idLastList) {
        return action.date;
      }
    }
  }
}

function getdateEntryInList2(card, idLastList) {
  var action;
  for (var i = 0; i < card.actions.length; i++) {
    action = card.actions[i];
    if (action.type === 'updateCard') {
      if (action.data !== undefined && action.data.listAfter !== undefined && action.data.listAfter.id === idLastList) {
        return action.date;
      }
    }
  }
}

function calculateLeadTime(card, idLastList, idFirstList) {
  var dateEntryInLastList = moment(getdateEntryInLastList(card, idLastList));
  var dateEntryInFirstList = moment(getdateEntryInFirstList(card, idFirstList));

  //console.log('Carte ' + card.name + ' Date Backlog = ' + dateEntryInFirstList.format() + ' Date Production = ' + dateEntryInLastList.format());

  return math.format(dateEntryInLastList.diff(dateEntryInFirstList, leadTimeUnit, true), 10);
}

function formatDate(date) {
  var options = "dddd, mmmm dS, yyyy, h:MM:ss TT";
  return dateFormat(date, options);
}

module.exports = {

  constructUrl: constructUrl,

  proxiedRequestGet: proxiedRequestGet,

  getdateEntryInFirstList: getdateEntryInFirstList,

  getdateEntryInLastList: getdateEntryInLastList,

  calculateLeadTime: calculateLeadTime,

  leadTimeUnit: leadTimeUnit,

  formatDate: formatDate,

  getCardNumbers: getCardNumbers,

  processTrelloData2: processTrelloData2,

  TRELLO_KEY: TRELLO_KEY,

  TRELLO_TOKEN: TRELLO_TOKEN

};
