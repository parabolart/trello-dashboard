proxiedRequest.get(urlbid, function (error, response, body) {

 /* if(error) {
    console.error(error);
    res.json(error);
  }*/
  //if (response.statusCode == 200) {
    console.info('Response OK');
    body = JSON.parse(body);
    var details = [];
    //var leadtime = 0;
    var card;
    //var cardtime = 0;
    //var bidsentdate = 0;
    //var parsebidsentdate = 0;
    //var momentbidsentdate = 0;
    //var parsecardtime = 0;
    //var momentcardtime = 0;
    //var now = moment();
    //now.tz('America/New_York');
    //var j = 0;
    //var bids = 0;
    //var client;
    //var bidvalue;
    //var spcr0 = 100;
    //var bidvaluesum = 0;
    //var thisweek = 0;
    //var weekfrom = 0;
    //var weekto;

    //thisweek = now.isoWeek();
    //weekfrom = now;//.startOf('week');
    //weekto = "April 8 - 12"
    //console.log(now);

    for (var i = 0; i < body.length; i++) {
      card = body[i];
      if(card.actions.length !== 0 && !card.closed) {

        details.push({ name: card.name });

        //cardtime = getdateEntryInFirstList(card, idBidSent); //getdateBidSent
        //parsecardtime = formatDate(cardtime);
        //momentcardtime = moment(cardtime);

        //bidsentdate = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['bidsentdate'], 'date');
        //parsebidsentdate = formatDate(bidsentdate);
        //momentbidsentdate = moment(bidsentdate);

        //if(bidsentdate){
        //  parsecardtime = parsebidsentdate;
        //  momentcardtime = momentbidsentdate;
        //}

        //if(today.isSame(momentcardtime, 'day')){
        //  console.log(momentcardtime.format("MM-DD-YYYY"));
        //  if(card.customFieldItems.length !== 0){
        //    details[0].push({ //[card.idList]
        //      name: card.name
        //    });
        //  }
        //} else if(today.subtract(1, 'days').isSame(momentcardtime, 'day')){
        //  if(card.customFieldItems.length !== 0){
        //    details[1].push({ //[card.idList]
        //      name: card.name
        //    });
        //  }
        //} else if(today.subtract(2, 'days').isSame(momentcardtime, 'day')){
        //  if(card.customFieldItems.length !== 0){
        //    details[2].push({ //[card.idList]
        //      name: card.name
        //    });
        //  }
        //} else if(today.subtract(3, 'days').isSame(momentcardtime, 'day')){
        //  if(card.customFieldItems.length !== 0){
        //    details[3].push({ //[card.idList]
        //      name: card.name
        //    });
        //  }
        //} else if(today.subtract(4, 'days').isSame(momentcardtime, 'day')){
        //  if(card.customFieldItems.length !== 0){
        //    details[4].push({ //[card.idList]
        //      name: card.name
        //    });
        //  }
        //} else if(today.subtract(5, 'days').isSame(momentcardtime, 'day')){
        //  if(card.customFieldItems.length !== 0){
        //    details[5].push({ //[card.idList]
        //      name: card.name
        //    });
        //  }
        //}

        //console.log(card.actions);
        //if(thisweek == momentcardtime.isoWeek()){
        //  if(card.customFieldItems.length !== 0){
        //    //console.log(card.customFieldItems);
        //    client = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['client'], 'text');
        //    bidvalue = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['bidvalue'], 'number');
        //    if(bidvalue!==null){
        //      console.log(bidvalue);
        //      //io.emit('chat message', bidvalue.toString());
        //      bidvaluesum += parseInt(bidvalue);
        //    }
        //  }
        //details.push({ bidvalue });
        //details.push({ id: card.id, name: card.name, closed: card.closed, cardtime: parsecardtime, client: client, bidvalue: bidvalue });
        }
      }

    var result = details;
    io.emit('chat message', result);//JSON.stringify(result));
    //res.json(result);
});
