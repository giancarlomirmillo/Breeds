// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {google} = require('googleapis');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const sheets = google.sheets('v4');


const serviceAccount = {
  "private_key": process.env.PRIVATEKEY, //service account key e.g. '-----BEGIN PRIVATE KEY-----\XXXXXXXXXX...'
  "client_email": process.env.CLIENTEMAIL //service account email 'example@project_rxdfre.iam.gserviceaccount.com'
};

const client = new google.auth.JWT({
	email: serviceAccount.client_email,
  	key: serviceAccount.private_key,
  	scopes:  ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']
});

 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 

  let responsePhrases = [
      // Add varying responses to alternate the responses.
      "Una razza davvero particolare! Se vuoi saperne di più leggi qui:",
      "Più che una razza è una filosofia di vita! Vuoi conoscerla meglio? Allora non perderti questa intervista:",
      "Complimenti per la scelta! Qui trovi tutte le informazioni:"
    ];
  let result;
  function spreadsheet (agent){
    return new Promise ((resolve, reject) =>{
      	let entity = agent.parameters.Breed[0];
    	client.authorize((err, tokens) => {
    	sheets.spreadsheets.values.get({
          	auth: client,
        	spreadsheetId: process.env.SPREADSHEETID,
          	range: `Sheet1!A2:B`
        }).then((res) => {
            if (err) {
              console.log("The API returned an error: " + err);
              agent.add("Mi dispiace ma non ne so abbastanza");
              return;
            } else {
              const rows = res.data.values;
              let row;
              let n = 1;
              for (row of rows) {
                n++;
                if (row.includes(entity.toLowerCase())) {
                  console.log(row);
                  result = `${responsePhrases[Math.floor(Math.random() * responsePhrases.length)]} ${row[1]}`;
                  console.log('I am done');
                  resolve(result);
                } else if (n > rows.length) {
                  result = "Mi dispiace ma non ne so abbastanza";
                  resolve(result);
                }
              }
            }
          
        });
    });
    }).then((result)=>{
    	agent.add(result);
    });
  }
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  let intentMap = new Map();
  intentMap.set('catchAll', spreadsheet);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});
