// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {google} = require('googleapis');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const sheets = google.sheets('v4');


const serviceAccount = {
  "private_key": process.env.815c9d9ec96af77540984f1aa0d58a1337a875b2, //service account key e.g. '-----BEGIN PRIVATE KEY-----\XXXXXXXXXX...'
  "client_email": process.env.dialogflow-tfqaew@knowledgebase-soxdss.iam.gserviceaccount.com//service account email 'example@project_rxdfre.iam.gserviceaccount.com'
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
      "Certo, ecco le informazioni che ti servono:",
      "Ecco i dati di:",
      "Subito le info che ti interessano:"
    ];
  let result;
  function spreadsheet (agent){
    return new Promise ((resolve, reject) =>{
      	let entity = agent.parameters.Breed[0];
    	client.authorize((err, tokens) => {
    	sheets.spreadsheets.values.get({
          	auth: client,
        	spreadsheetId: process.env.https:https://docs.google.com/spreadsheets/d/1obRQ7I-KLJbz1Xp0TQHkzRiby9Jtv7vbjkBwATB4YaM/edit?usp=sharing
          	range: `Sheet1!C2:B`
        }).then((res) => {
            if (err) {
              console.log("Spreadshet returned an error: " + err);
              result = "Mi dispiace ma non ne so abbastanza";
              resolve(result)
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
    agent.add(`Benvenuto sono il tuo assistente digitale!`);
  }
 
  function fallback(agent) {
    agent.add(`Oops non ho capito`);
    agent.add(`Scusa protresti ripeterlo?`);
  }

  let intentMap = new Map();
  intentMap.set('catchAll', spreadsheet);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});
