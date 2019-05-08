'use strict';

var express = require('express');
var app =  module.exports = express();
var trelloUtils = require('./trelloUtils.js');
var math = require('mathjs');
var moment = require('moment-timezone');
var request = require('request');
var http = require('http').Server(app);
var io = require('socket.io')(http);
let shell = require('shelljs');
var cron = require('node-cron');
//var proxiedRequest = request.defaults({proxy: "http://127.0.0.1:3128"});
var proxiedRequest = request;

const fs = require('fs')
//const jsPDF = require('jspdf/dist/jspdf.node.min')
const PDFDocument = require('pdfkit');
var SVGtoPDF = require('svg-to-pdfkit');

var trelloIDS = {
  'client': '5c7812a444111f835dd0ca43',
  'poc': '5c7812b0a95d3333486e74c4',
  'contactnumber': '5c7812bb8ba143056f12ebae',
  'contactemail': '5c7812c4d8d40268d8b3873e',
  'bidvalue': '5c7812e25fe9700eb0f72c03',
  'bidsentdate': '5caf8169fb553d1649481657',

  'listemailin': '5c780d8bf8e2634893342172',
  'listprinting': '5c780fdaf1745e5e1ef9ad08',
  'listbreakout': '5c780fe10807d615f0de72e6', //estimating
  'listbreaking': '5cb62ec598effd338e398b24',
  'listreview': '5c780fefa7947a5486324c7e', //speed bid
  'listsendbid': '5c780ff410efb72b17454e44',
  'listbidsent': '5c780ff841e6d46153f9ee04',
  'listfollowup': '5c7ef4d6534d873556e56600',
  'listapproval': '5c7810146fd84761af535cef',
  'listkickoff': '5ca38da403ea0f50ead089d5'
};


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

PDFDocument.prototype.addSVG = function(svg, x, y, options) {
  return SVGtoPDF(this, svg, x, y, options), this;
};

Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
//router.get('/', function(req, res) {
//  res.sendFile(__dirname + '/index.html');
//  console.log("what is up");
  //res.send('Welcome to our trello lead time calculator !');
//});

function selectWhere(data, propertyName, property2, type) {
  for (var i = 0; i < data.length; i++) {
    if (data[i][propertyName] == property2) return data[i]['value'][type];
  }
  return null;
}

router.get('/myBoards', function(req, res, next){
		trelloUtils.proxiedRequestGet('https://api.trello.com/1/members/me/boards?filter=open&fields=name', res, next);
});


router.get('/lists/:idBoard', function(req, res, next){
	var idBoard = req.params.idBoard;

	trelloUtils.proxiedRequestGet('https://api.trello.com/1/boards/' + idBoard + '/lists?filter=open&fields=name', res, next);
});

router.get('/lead-time/:idFirstList/:idLastList', function(req,res){
	var idFirstList = req.params.idFirstList;
	var idLastList = req.params.idLastList;

	var url = trelloUtils.constructUrl('https://api.trello.com/1/lists/' + idLastList + '/cards?actions=all&fields=name&filter=all');

	console.info('GET URL => ' + url);

	proxiedRequest.get(url, function (error, response, body) {
	 /* if(error) {
	  	console.error(error);
	  	res.json(error);
	  }*/
	  //if (response.statusCode == 200) {
	  	console.info('Response OK');
	    body = JSON.parse(body);
	    var details = [];
	    var leadtime = 0;
	    var card;
	    var cardleadtime = 0;
	    //console.log('length = ' + body.length);
	    for (var i = 0; i < body.length; i++) {
	    	card = body[i];
	    	if(card.actions.length !== 0) {
  	    	cardleadtime = trelloUtils.calculateLeadTime(card, idLastList, idFirstList);
  	    	if(+cardleadtime > 0) {
	  	    	leadtime = math.add(+leadtime, +cardleadtime);
	  	    	details.push({ 'id': card.id, 'name': card.name, 'leadTime': cardleadtime });
  	    	}
  	    }
	    }

	    //console.log('total = '+ leadtime);
	    leadtime = math.format(math.divide(+leadtime, +details.length), 4);

	    var result = { 'idFirstList': idFirstList, 'idLastList': idLastList, 'leadTime': leadtime, 'leadTimeUnit': trelloUtils.leadTimeUnit, 'details': details};

	    res.json(result);
	 // }
	});

});

router.get('/export-3-lists/:idFirstList', function(req,res){
	var idFirstList = req.params.idFirstList;
  var board = '5c780c720a100113beb84b44';

	var url = trelloUtils.constructUrl('https://api.trello.com/1/boards/' + board + '/cards/open?fields=id,name,desc,due,idBoard,idList,idLabels,idChecklists,idMembers,dueCompleted&customFieldItems=true&filter=all');

	console.info('GET URL => ' + url);

	proxiedRequest.get(url, function (error, response, body) {
	 /* if(error) {
	  	console.error(error);
	  	res.json(error);
	  }*/
	  //if (response.statusCode == 200) {
	  	console.info('Response OK');
      body = JSON.parse(body);
      var details = [];
      var card, client, poc, contactnumber, contactemail;
      var html_res = "<h1 style='font-family: Arial'>Needs Printing, Estimating, Speed Bid</h1><table style='font:14px Arial; border: 1px solid #888; border-collapse: collapse;' border='1' cellpadding='4'>";

      html_res += "<tr><td style='background-color:rgb(207, 207, 207)'><b>Job Name</b></td><td style='background-color:rgb(207, 207, 207)'><b>Client Name</b></td><td style='background-color:rgb(207, 207, 207)'><b>Person of Contact</b></td><td style='background-color:rgb(207, 207, 207)'><b>Phone</b></td><td style='background-color:rgb(207, 207, 207)'><b>Email</b></td></tr>";

      for (var i = 0; i < body.length; i++) {
        card = body[i];
        if(card.idList === trelloIDS['listprinting'] || card.idList === trelloIDS['listbreakout'] || card.idList === trelloIDS['listreview']) {

          if(card.customFieldItems.length !== 0){

            client = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['client'], 'text');
            poc = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['poc'], 'text');
            contactnumber = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['contactnumber'], 'text');
            contactemail = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['contactemail'], 'text');

          }

          details.push({ 'list': card.idList, 'id': card.id, 'name': card.name, 'client': client, 'POC': poc, 'contactnumber': contactnumber, 'contactemail': contactemail, 'desc': card.desc });
          html_res += ('<tr><td style="background-color: rgb(190, 237, 255); width:45%">'+card.name+'</td><td style="background-color: rgb(255, 190, 190);">'+client+'</td><td style="background-color: rgb(190, 210, 255);">'+poc+'</td><td style="background-color: rgb(219, 255, 190);">'+contactnumber+'</td><td style="background-color: rgb(255, 248, 190);">'+contactemail+'</td></tr>');
          html_res += ('<tr><td colspan="5">'+card.desc+'</td></tr><tr><td colspan="5" height="3" style="background-color: rgb(231, 230, 158);"></td></tr>');

        }
      }

      var result = {'details': details};
      html_res += ('</table>');
      //res.json(result);
      res.send(html_res);
	 // }
	});

});

router.get('/hmh-lead-time-week/:idFirstList', function(req,res){

	var idFirstList = req.params.idFirstList;

	var url = trelloUtils.constructUrl('https://api.trello.com/1/lists/' + idFirstList + '/cards?actions=all&fields=name,closed&filter=all');

	console.info('GET URL => ' + url);

	proxiedRequest.get(url, function (error, response, body) {

    var doc = new PDFDocument({
      size: [936,1368],
      layout: 'landscape'
    });
    doc.pipe(fs.createWriteStream('output.pdf')); // write to PDF

	 /* if(error) {
	  	console.error(error);
	  	res.json(error);
	  }*/
	  //if (response.statusCode == 200) {
	  	console.info('Response OK');
	    body = JSON.parse(body);
	    var details = [];
	    var leadtime = 0;
	    var card;
	    var cardtime = 0;
      var parsecardtime = 0;
      var momentcardtime = 0;
      var now = moment();
      var j = 0;
      var svg_email = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118.13 60.53"><defs><style>.cls-1{fill:#231f20;}</style></defs><title>Asset 2</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,19.75c2.34-8.62,9.89-14.14,18.72-14.7A23.9,23.9,0,0,1,36.92,7.82c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.14-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82C47.57,12.85,45.61,8.1,41.6,5,36.72,1.12,29.72-.3,23.64.05,12.63.68,3,7.64.1,18.42c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,15.72c-3.2-.89-6.44-1.76-9.71-2.37s-4.49,4.24-1.33,4.83,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/><path class="cls-1" d="M115,41.41,49.76,55.64l3.07,1.75L45.48,23.68l-1.75,3.08L109,12.52l-3.08-1.75,7.36,33.71c.69,3.14,5.51,1.81,4.82-1.33l-7.35-33.7a2.55,2.55,0,0,0-3.08-1.75L42.4,21.94A2.55,2.55,0,0,0,40.65,25L48,58.72a2.54,2.54,0,0,0,3.08,1.74l65.23-14.23C119.46,45.54,118.13,40.72,115,41.41Z"/><path class="cls-1" d="M42.4,26.76,62,32,73.89,35.2c1.64.44,4.35,1.75,6.13,1.29s3.65-2.75,4.94-3.81l9.49-7.87,15.61-12.93c2.48-2.06-1.07-5.58-3.53-3.54l-28.94,24L80,31.67,43.73,21.94c-3.11-.84-4.44,4-1.33,4.82Z"/></g></g></svg>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52.4 21.52"><defs><style>.cls-1{fill:#231f20;}</style></defs><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,19.75c2.34-8.62,9.89-14.14,18.72-14.7A23.9,23.9,0,0,1,36.92,7.82c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.14-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82C47.57,12.85,45.61,8.1,41.6,5,36.72,1.12,29.72-.3,23.64.05,12.63.68,3,7.64.1,18.42c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,15.72c-3.2-.89-6.44-1.76-9.71-2.37s-4.49,4.24-1.33,4.83,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/></g></g></svg>';
	    //console.log('length = ' + body.length);
	    for (var i = 0; i < body.length; i++) {
	    	card = body[i];
        if(card.actions.length !== 0 && !card.closed) {
          cardtime = trelloUtils.getdateEntryInFirstList(card, idFirstList);
          parsecardtime = trelloUtils.formatDate(cardtime);
          momentcardtime = moment(cardtime);
          //console.log(card.actions);
          if((now.isoWeek()) == momentcardtime.isoWeek()){
  	    	    details.push({ id: card.id, name: card.name, closed: card.closed, cardtime: parsecardtime });

              doc.font('fonts/Lora-Regular.ttf')
                .fontSize(14)
                .lineWidth(1.5)
                .text(card.name, 10, 50*j+12, {
                  lineBreak: false,
                  ellipsis: '...',
                  width: 300,
                  height: 20,
                  indent: 3
                });
              doc.rect(10, 50*j+10, 300, 20).stroke();
              //doc.path('M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90').stroke();
              doc.addSVG(svg_email, 305, 50*j+10, {height: 41/1.5, width: 72/1.5});
              doc.font('fonts/Lora-Italic.ttf')
                .fontSize(10)
                .text(parsecardtime, 10, 50*j-5, {
                  width: 300,
                  align: 'right'
                });
              //destination
              //doc.rect(320, 25*j+10, 50, 20).stroke();
              j++;
          }
        }
	    }

      doc.end();
	    //console.log('total = '+ leadtime);
	    //leadtime = math.format(math.divide(+leadtime, +details.length), 4);

	    var result = details;//{ 'idFirstList': idFirstList, 'leadTimeUnit': trelloUtils.leadTimeUnit, 'details': details};

	    res.json(result);
	 // }
	});

});

router.get('/hmh-bids-sent-week', function(req,res){

	var idBidSent = trelloIDS['listbidsent'];//req.params.idFirstList;

  var idEmailIn = trelloIDS['listemailin'];

	var urlbid = trelloUtils.constructUrl('https://api.trello.com/1/lists/' + idBidSent + '/cards?actions=all&fields=name,closed&customFieldItems=true&filter=all');

  var urlemail = trelloUtils.constructUrl('https://api.trello.com/1/lists/' + idEmailIn + '/cards?actions=all&fields=name,closed&customFieldItems=true&filter=all');

	console.info('GET URL BIDS SENT => ' + urlbid);

  console.info('GET URL EMAIL IN => ' + urlemail);

	proxiedRequest.get(urlbid, function (error, response, body) {

    var doc = new PDFDocument({
      size: [936,700],
      layout: 'landscape'
    }); //[936,1368],
    doc.pipe(fs.createWriteStream('output.pdf')); // write to PDF

	 /* if(error) {
	  	console.error(error);
	  	res.json(error);
	  }*/
	  //if (response.statusCode == 200) {
	  	console.info('Response OK');
	    body = JSON.parse(body);
	    var details = [];
	    var leadtime = 0;
	    var card;
	    var cardtime = 0;
      var bidsentdate = 0;
      var parsebidsentdate = 0;
      var momentbidsentdate = 0;
      var parsecardtime = 0;
      var momentcardtime = 0;
      var now = moment();
      now.tz('America/New_York');
      var j = 0;
      var bids = 0;
      var client;
      var bidvalue;
      var spcr0 = 100;
      var bidvaluesum = 0;
      var thisweek = 0;
      var weekfrom = 0;
      var weekto;

      thisweek = now.isoWeek();
      weekfrom = now;//.startOf('week');
      weekto = "April 8 - 12"
      console.log(now);

      var svg_bidsent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118.13 66.03"><defs><style>.cls-1{fill:#231f20;}.cls-2{fill:#fff;}</style></defs><title>Asset 3</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,25.25c2.34-8.61,9.89-14.14,18.72-14.7a23.9,23.9,0,0,1,13.28,2.77c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.13-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82c-1.8-4.62-3.76-9.37-7.77-12.52-4.88-3.82-11.88-5.25-18-4.9C12.63,6.18,3,13.14.1,23.92c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,21.22c-3.2-.89-6.44-1.76-9.71-2.36s-4.49,4.23-1.33,4.82,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/><path class="cls-1" d="M115,46.91,49.76,61.14l3.07,1.75L45.48,29.18l-1.75,3.08L109,18l-3.08-1.74L113.24,50c.69,3.14,5.51,1.81,4.82-1.33L110.71,15a2.56,2.56,0,0,0-3.08-1.75L42.4,27.44a2.55,2.55,0,0,0-1.75,3.07L48,64.22A2.55,2.55,0,0,0,51.09,66l65.23-14.24C119.46,51,118.13,46.22,115,46.91Z"/><rect class="cls-2" x="65.22" y="18.63" width="24.12" height="7.25" transform="translate(-2.97 16.99) rotate(-12.31)"/><path class="cls-1" d="M42.4,32.26,62,37.51l11.91,3.2c1.64.44,4.35,1.74,6.13,1.28s3.65-2.75,4.94-3.81l9.49-7.87,15.61-12.93c2.48-2.06-1.07-5.58-3.53-3.54l-28.94,24L80,37.17,43.73,27.44c-3.11-.84-4.44,4-1.33,4.82Z"/><path class="cls-1" d="M77,.49l0,.3-.28,3.72,3.05.24L80.05.86a.76.76,0,0,1,.44-.44A.49.49,0,0,1,80.8.35a.67.67,0,0,1,.47.22.71.71,0,0,1,.18.6l-.3,3.88L84,6.22c.7.75,1.49,1.65,2.35,2.7a.59.59,0,0,1,0,.34l0,.24a.75.75,0,0,1-.67.45A1,1,0,0,1,85,9.56L83.19,7.4,81,6.53l-.79,10.31a10.61,10.61,0,0,1,1.48.79l1.4.85L84.38,20l1,2.41-.29,3.75-.12.22-2.63,2.19-3.06.81L79,33.45a.58.58,0,0,1-.36.36,1.06,1.06,0,0,1-.4.08.59.59,0,0,1-.5-.24,2.07,2.07,0,0,1-.09-1.08l.25-3.18-3-.24-.31,4a.59.59,0,0,1-.4.38.64.64,0,0,1-.34,0,.72.72,0,0,1-.49-.22.75.75,0,0,1-.15-.57l.29-3.87-2.86-1.26-2.32-2.72a.54.54,0,0,1,0-.27,1.09,1.09,0,0,1,.1-.33.82.82,0,0,1,.8-.35l.23.12,2.13,2.42,2.09.87.88-11.45a7.87,7.87,0,0,1-1.47-.75c-.78-.49-1.25-.77-1.4-.85L70.3,12.81l-1-2.47.2-2.58.15-.19,2.65-2.25L73.78,5l1.51-.38L75.6.48A.76.76,0,0,1,76,0a1.33,1.33,0,0,1,.38,0A.67.67,0,0,1,77,.49ZM72.47,13.21l2.06,1.2.64-8.33-2.25.56-2,1.77-.13,1.7.79,2Zm6.4,3,.78-10.08L76.6,5.92,75.9,15Zm-.12,1.54-3-1.24-.86,11.22L78,28Zm4.36,2.9-.86-1.05-2.13-1.27-.73,9.47,2.27-.56,2-1.77.22-2.81Z"/></g></g></svg>';
      var svg_email = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118.13 60.53"><defs><style>.cls-1{fill:#231f20;}</style></defs><title>Asset 2</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,19.75c2.34-8.62,9.89-14.14,18.72-14.7A23.9,23.9,0,0,1,36.92,7.82c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.14-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82C47.57,12.85,45.61,8.1,41.6,5,36.72,1.12,29.72-.3,23.64.05,12.63.68,3,7.64.1,18.42c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,15.72c-3.2-.89-6.44-1.76-9.71-2.37s-4.49,4.24-1.33,4.83,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/><path class="cls-1" d="M115,41.41,49.76,55.64l3.07,1.75L45.48,23.68l-1.75,3.08L109,12.52l-3.08-1.75,7.36,33.71c.69,3.14,5.51,1.81,4.82-1.33l-7.35-33.7a2.55,2.55,0,0,0-3.08-1.75L42.4,21.94A2.55,2.55,0,0,0,40.65,25L48,58.72a2.54,2.54,0,0,0,3.08,1.74l65.23-14.23C119.46,45.54,118.13,40.72,115,41.41Z"/><path class="cls-1" d="M42.4,26.76,62,32,73.89,35.2c1.64.44,4.35,1.75,6.13,1.29s3.65-2.75,4.94-3.81l9.49-7.87,15.61-12.93c2.48-2.06-1.07-5.58-3.53-3.54l-28.94,24L80,31.67,43.73,21.94c-3.11-.84-4.44,4-1.33,4.82Z"/></g></g></svg>';
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52.4 21.52"><defs><style>.cls-1{fill:#231f20;}</style></defs><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,19.75c2.34-8.62,9.89-14.14,18.72-14.7A23.9,23.9,0,0,1,36.92,7.82c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.14-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82C47.57,12.85,45.61,8.1,41.6,5,36.72,1.12,29.72-.3,23.64.05,12.63.68,3,7.64.1,18.42c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,15.72c-3.2-.89-6.44-1.76-9.71-2.37s-4.49,4.24-1.33,4.83,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/></g></g></svg>';
	    //console.log('length = ' + body.length);

	    for (var i = 0; i < body.length; i++) {
	    	card = body[i];
        if(card.actions.length !== 0 && !card.closed) {

          cardtime = trelloUtils.getdateEntryInFirstList(card, idBidSent); //getdateBidSent
          parsecardtime = trelloUtils.formatDate(cardtime);
          momentcardtime = moment(cardtime);

          bidsentdate = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['bidsentdate'], 'date');
          parsebidsentdate = trelloUtils.formatDate(bidsentdate);
          momentbidsentdate = moment(bidsentdate);

          if(bidsentdate){
            parsecardtime = parsebidsentdate;
            momentcardtime = momentbidsentdate;
          }

          //console.log(card.actions);
          //if(thisweek == momentcardtime.isoWeek()){ THIS IS WHAT NEEDS TO COME BACK FOR WEEKLY
            if(card.customFieldItems.length !== 0){
              //console.log(card.customFieldItems);
              client = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['client'], 'text');
              bidvalue = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['bidvalue'], 'number');
              if(bidvalue!==null){
                console.log(bidvalue);
                bidvaluesum += parseInt(bidvalue);
              }
            }
	    	    details.push({ id: card.id, name: card.name, closed: card.closed, cardtime: parsecardtime, client: client, bidvalue: bidvalue });

            doc.font('fonts/Lora-Regular.ttf')
              .fontSize(14)
              .lineWidth(1.5)
              .text(card.name, 50, 50*j+12+spcr0, {
                lineBreak: false,
                ellipsis: '...',
                width: 300,
                height: 20,
                indent: 3
              });
            doc.font('fonts/Lora-Bold.ttf')
              .fontSize(14)
              .text(client, 400, 50*j+12+spcr0, {
                lineBreak: false,
                ellipsis: '...',
                width: 300,
                height: 20,
                indent: 3
              });
            doc.rect(50, 50*j+10+spcr0, 300, 20).stroke();
            //doc.path('M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90').stroke();
            doc.addSVG(svg_bidsent, 345, 50*j+10+spcr0, {height: 41/1.5, width: 72/1.5});
            doc.font('fonts/Lora-Italic.ttf')
              .fontSize(10)
              .text(parsecardtime, 50, 50*j-5+spcr0, {
                width: 300,
                height: 20,
                align: 'right'
              })
              .text('$'+(parseInt(bidvalue).format(2)), 400, 50*j+30+spcr0, {
                width: 300,
                height: 20,
                align: 'left'
              });
            //destination
            //doc.rect(320, 25*j+10, 50, 20).stroke();
            if(50*j+100+spcr0 >= 936) {
              console.log (50*j+100+spcr0);
              j = 0;
              doc.addPage();
            } else {
              j++;
            }
            bids++;
          //}
        }
	    }

      doc.font('fonts/Lora-Bold.ttf')
        .fontSize(16)
        .text("Bids sent: "+bids, 50, 50, { //"Bids sent this week:
          lineBreak: false,
          ellipsis: '...',
          width: 300,
          height: 20,
          indent: 0
        })
      doc.font('fonts/Lora-Italic.ttf')
        .fontSize(16)
        .text("Bid value total: "+'$'+(parseInt(bidvaluesum).format(2)), 350, 50, {
          lineBreak: false,
          ellipsis: '...',
          width: 300,
          height: 20,
          indent: 0
        });

      //doc.font('fonts/Lora-Regular.ttf')
      //  .fontSize(16)
      //  .text("Week: "+weekto, 50, 30, {
      //    lineBreak: false,
      //    ellipsis: '...',
      //    width: 500,
      //    height: 20,
      //    indent: 0
      //  });

      doc.end();

	    //console.log('total = '+ leadtime);
	    //leadtime = math.format(math.divide(+leadtime, +details.length), 4);

	    var result = details;//{ 'idFirstList': idFirstList, 'leadTimeUnit': trelloUtils.leadTimeUnit, 'details': details};

	    res.json(result);
	 // }
	});



});

module.exports = router;
