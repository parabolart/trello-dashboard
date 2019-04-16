'use strict';

var moment = require('moment');
var math = require('mathjs');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const dotenv = require('dotenv');
dotenv.config();

var output;

var request = require('request');
//var proxiedRequest = request.defaults({proxy: "http://127.0.0.1:3128"});
var proxiedRequest = request;

var leadTimeUnit = 'days';
var dateFormat = require('dateformat');
var TRELLO_KEY = process.env.TRELLO_KEY;
var TRELLO_TOKEN = process.env.TRELLO_TOKEN;

function constructUrl(url) {
  if (url.indexOf('?') === -1) {
    url = url + '?';
  } else {
    url = url + '&';
  }

  url = url + 'key=' + TRELLO_KEY + '&token=' + TRELLO_TOKEN;
  return url;
}

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
});

function proxiedRequestGet(url, res, next, io) {

  url = constructUrl(url);

  console.info('GET URL => ' + url);

  proxiedRequest.get(url, function(error, response, body) {

    //Always resend same StatusCode as request
    res.statusCode = response.statusCode;

    if (!error && response.statusCode == 200) {
      console.info('Response OK');
      io.emit('chat message', body.toString());
      //res.send(body.toString());
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

  TRELLO_KEY: TRELLO_KEY,

  TRELLO_TOKEN: TRELLO_TOKEN

};
