var trelloIDS = {
  'client': '5c7812a444111f835dd0ca43',
  'bidvalue': '5c7812e25fe9700eb0f72c03'
};

proxiedRequest.get(urlemail, function (error, response, body) {

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
    var bids = 0;
    var client;
    var bidvalue;
    var spcr0 = 500;
    var svg_bidsent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118.13 66.03"><defs><style>.cls-1{fill:#231f20;}.cls-2{fill:#fff;}</style></defs><title>Asset 3</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,25.25c2.34-8.61,9.89-14.14,18.72-14.7a23.9,23.9,0,0,1,13.28,2.77c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.13-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82c-1.8-4.62-3.76-9.37-7.77-12.52-4.88-3.82-11.88-5.25-18-4.9C12.63,6.18,3,13.14.1,23.92c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,21.22c-3.2-.89-6.44-1.76-9.71-2.36s-4.49,4.23-1.33,4.82,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/><path class="cls-1" d="M115,46.91,49.76,61.14l3.07,1.75L45.48,29.18l-1.75,3.08L109,18l-3.08-1.74L113.24,50c.69,3.14,5.51,1.81,4.82-1.33L110.71,15a2.56,2.56,0,0,0-3.08-1.75L42.4,27.44a2.55,2.55,0,0,0-1.75,3.07L48,64.22A2.55,2.55,0,0,0,51.09,66l65.23-14.24C119.46,51,118.13,46.22,115,46.91Z"/><rect class="cls-2" x="65.22" y="18.63" width="24.12" height="7.25" transform="translate(-2.97 16.99) rotate(-12.31)"/><path class="cls-1" d="M42.4,32.26,62,37.51l11.91,3.2c1.64.44,4.35,1.74,6.13,1.28s3.65-2.75,4.94-3.81l9.49-7.87,15.61-12.93c2.48-2.06-1.07-5.58-3.53-3.54l-28.94,24L80,37.17,43.73,27.44c-3.11-.84-4.44,4-1.33,4.82Z"/><path class="cls-1" d="M77,.49l0,.3-.28,3.72,3.05.24L80.05.86a.76.76,0,0,1,.44-.44A.49.49,0,0,1,80.8.35a.67.67,0,0,1,.47.22.71.71,0,0,1,.18.6l-.3,3.88L84,6.22c.7.75,1.49,1.65,2.35,2.7a.59.59,0,0,1,0,.34l0,.24a.75.75,0,0,1-.67.45A1,1,0,0,1,85,9.56L83.19,7.4,81,6.53l-.79,10.31a10.61,10.61,0,0,1,1.48.79l1.4.85L84.38,20l1,2.41-.29,3.75-.12.22-2.63,2.19-3.06.81L79,33.45a.58.58,0,0,1-.36.36,1.06,1.06,0,0,1-.4.08.59.59,0,0,1-.5-.24,2.07,2.07,0,0,1-.09-1.08l.25-3.18-3-.24-.31,4a.59.59,0,0,1-.4.38.64.64,0,0,1-.34,0,.72.72,0,0,1-.49-.22.75.75,0,0,1-.15-.57l.29-3.87-2.86-1.26-2.32-2.72a.54.54,0,0,1,0-.27,1.09,1.09,0,0,1,.1-.33.82.82,0,0,1,.8-.35l.23.12,2.13,2.42,2.09.87.88-11.45a7.87,7.87,0,0,1-1.47-.75c-.78-.49-1.25-.77-1.4-.85L70.3,12.81l-1-2.47.2-2.58.15-.19,2.65-2.25L73.78,5l1.51-.38L75.6.48A.76.76,0,0,1,76,0a1.33,1.33,0,0,1,.38,0A.67.67,0,0,1,77,.49ZM72.47,13.21l2.06,1.2.64-8.33-2.25.56-2,1.77-.13,1.7.79,2Zm6.4,3,.78-10.08L76.6,5.92,75.9,15Zm-.12,1.54-3-1.24-.86,11.22L78,28Zm4.36,2.9-.86-1.05-2.13-1.27-.73,9.47,2.27-.56,2-1.77.22-2.81Z"/></g></g></svg>';
    var svg_email = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118.13 60.53"><defs><style>.cls-1{fill:#231f20;}</style></defs><title>Asset 2</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,19.75c2.34-8.62,9.89-14.14,18.72-14.7A23.9,23.9,0,0,1,36.92,7.82c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.14-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82C47.57,12.85,45.61,8.1,41.6,5,36.72,1.12,29.72-.3,23.64.05,12.63.68,3,7.64.1,18.42c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,15.72c-3.2-.89-6.44-1.76-9.71-2.37s-4.49,4.24-1.33,4.83,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/><path class="cls-1" d="M115,41.41,49.76,55.64l3.07,1.75L45.48,23.68l-1.75,3.08L109,12.52l-3.08-1.75,7.36,33.71c.69,3.14,5.51,1.81,4.82-1.33l-7.35-33.7a2.55,2.55,0,0,0-3.08-1.75L42.4,21.94A2.55,2.55,0,0,0,40.65,25L48,58.72a2.54,2.54,0,0,0,3.08,1.74l65.23-14.23C119.46,45.54,118.13,40.72,115,41.41Z"/><path class="cls-1" d="M42.4,26.76,62,32,73.89,35.2c1.64.44,4.35,1.75,6.13,1.29s3.65-2.75,4.94-3.81l9.49-7.87,15.61-12.93c2.48-2.06-1.07-5.58-3.53-3.54l-28.94,24L80,31.67,43.73,21.94c-3.11-.84-4.44,4-1.33,4.82Z"/></g></g></svg>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52.4 21.52"><defs><style>.cls-1{fill:#231f20;}</style></defs><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M4.92,19.75c2.34-8.62,9.89-14.14,18.72-14.7A23.9,23.9,0,0,1,36.92,7.82c4.15,2.45,5.95,6.68,7.63,11a2.53,2.53,0,0,0,4.82,0,75.1,75.1,0,0,0,3-9.94c.72-3.14-4.1-4.47-4.82-1.33a75.1,75.1,0,0,1-3,9.94h4.82C47.57,12.85,45.61,8.1,41.6,5,36.72,1.12,29.72-.3,23.64.05,12.63.68,3,7.64.1,18.42c-.85,3.11,4,4.44,4.82,1.33Z"/><path class="cls-1" d="M47.62,15.72c-3.2-.89-6.44-1.76-9.71-2.37s-4.49,4.24-1.33,4.83,6.51,1.47,9.71,2.36,4.43-4,1.33-4.82Z"/></g></g></svg>';
    //console.log('length = ' + body.length);
    for (var i = 0; i < body.length; i++) {
      card = body[i];
      if(card.actions.length !== 0 && !card.closed) {
        cardtime = trelloUtils.getdateEntryInFirstList(card, idEmailIn); //getdateBidSent
        parsecardtime = trelloUtils.formatDate(cardtime);
        momentcardtime = moment(cardtime);
        //console.log(card.actions);
        if((now.isoWeek()) == momentcardtime.isoWeek()){
          if(card.customFieldItems.length !== 0){
            //console.log(card.customFieldItems);
            client = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['client'], 'text');
            bidvalue = selectWhere(card.customFieldItems, 'idCustomField', trelloIDS['bidvalue'], 'number');
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
          if(50*j+100+spcr0 >= 836) {
            console.log (50*j+100+spcr0);
            j = 0;
            doc.addPage();
          } else {
            j++;
          }
          bids++;
        }
      }
    }

    doc.font('fonts/Lora-Bold.ttf')
      .fontSize(16)
      .text("Bids sent this week: "+bids, 50, 50, {
        lineBreak: false,
        ellipsis: '...',
        width: 300,
        height: 20,
        indent: 0
      });

    //console.log('total = '+ leadtime);
    //leadtime = math.format(math.divide(+leadtime, +details.length), 4);

    var result = details;//{ 'idFirstList': idFirstList, 'leadTimeUnit': trelloUtils.leadTimeUnit, 'details': details};

    res.json(result);
 // }
});
