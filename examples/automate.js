'use strict';

var Bot = require('../');

var bot = new Bot({
  token: 'c2a559698707424bb63dc63e4ba357cbb5a033c1',
  user: 'stevelacy',
  message: 'update deps',
  owner: 'SQUADQ',
  repo: 'k',
  branch: 'master',
  forkBranch: 'master'
});


bot.automate(function(err) {
  if (err) {
    console.log(err);
  }
});
