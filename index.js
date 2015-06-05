'use strict';

var exec = require('child_process').exec;
var async = require('async');
var Github = require('github-api');

function Bot(opts) {
  this.opts = opts;

  this.github = new Github({
    token: this.opts.token,
    auth: 'oauth'
  });

  this.repo = this.github.getRepo(opts.owner, opts.repo);
}

Bot.prototype.fork = function(cb) {
  this.repo.fork(function(err, data) {
    if (err){
      return cb(err);
    }
    var cwd = __dirname + '/repos';
    var cmd = 'git clone ' + data.clone_url;
    exec(cmd, {cwd: cwd}, function (err, stderr, stdout) {
      if (err) {
        return cb(err);
      }
      var output = {
        stderr: stderr,
        stdout: stdout,
        data: data
      };
      return cb(null, output);
    });
  });
};

Bot.prototype.update = function(data, cb) {
  var cwd = __dirname + '/repos/' + data.name;
  var cmd = 'npm update --save && npm update --save-dev';
  exec(cmd, {cwd: cwd}, function (err, stderr, stdout) {
    if (err) {
      return cb(err);
    }
    var output = {
      stderr: stderr,
      stdout: stdout,
      data: data
    };
    return cb(null, output);
  });
};

Bot.prototype.commit = function(data, cb) {
  var cwd = __dirname + '/repos/' + data.name;
  var cmd = 'git add . -A && git commit -m "' + this.opts.message + '"';
  exec(cmd, {cwd: cwd}, function (err, stderr, stdout) {
    if (err) {
      return cb(err);
    }
    var output = {
      stderr: stderr,
      stdout: stdout,
      data: data
    };
    return cb(null, output);
  });
};

Bot.prototype.push = function(data, cb) {
  var cwd = __dirname + '/repos/' + data.name;
  var cmd = 'git push origin ' + this.opts.branch;
  exec(cmd, {cwd: cwd}, function (err, stderr, stdout) {
    if (err) {
      return cb(err);
    }
    var output = {
      stderr: stderr,
      stdout: stdout,
      data: data
    };
    return cb(null, output);
  });
};

Bot.prototype.pullRequest = function(data, cb) {
  var pr = {
    title: this.opts.message,
    body: this.opts.body,
    base: this.opts.branch,
    head: this.opts.user + ':' + this.opts.forkBranch
  };

  this.repo.createPullRequest(pr, function (err, output) {
    return cb(err, output);
  });
};

Bot.prototype.automate = function(cb) {
  var self = this;

  self.fork(function(err, output) {
    if (err) return cb(err);

    async.series([
      function(cb) {
        self.update(output.data, function(err, output) {
          console.log('Updating dependencies');
          cb(err, output);
        });
      },
      function(cb) {
        self.commit(output.data, function(err, output) {
          console.log('Committing changes');
          cb(err, output);
        });
      },
      function(cb) {
        self.push(output.data, function(err, output) {
          console.log('Pushing commits');
          cb(err, output);
        });
      },
      function(cb) {
        console.log('Waiting 2 seconds');
        setTimeout(function() {
          self.pullRequest(output.data, function(err, output) {
            console.log('Creating Pull Request');
            cb(err, output);
          });
        }, 2000);
      }
    ],
    function(err, results) {
      if (err) {
        return cb(err);
      }
      console.log('Finished');
      cb(err, results);
    });
  });
};

module.exports = Bot;
