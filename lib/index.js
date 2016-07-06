var request = require('request');
var _ = require('highland');

var URL = 'https://api.intercom.io';
var auth = {
  'user': process.env.INTERCOM_APP_ID,
  'pass': process.env.INTERCOM_API_KEY
};

/**
 * Function to perform a get request with given uri and options, handles pagination recursively and writes all results to the same stream
 * @param {string} field Field to be accessed in Intercom request
 * @param {stream} stream Stream to write data to
 * @param {object} options Options object for the HTTP request
 * @param {function} callback Callback function to call if error or successful return
 * @return {void}
 */
var getData = function(field, stream, options, callback) {
  var stream = stream || _(); // eslint-disable-line no-redeclare


  // console.log('fetching..' + options.uri);

  request.get(options, function(error, response, body) {
    if (error || body.errors) {
      callback(error || body.errors);
      return;
    }

    var data = body[field];
    if (data.length > 0) {
      stream.write(data);

      if (body.pages && body.pages.next) {
        var nextOptions = {
          uri: body.pages.next,
          json: true,
          auth: auth
        };
        getData(field, stream, nextOptions, callback);
      } else {
        stream.end();
        callback(null, stream);
        return;
      }
    }
  });

  // return callback(null, stream);
};

/**
 *
 * @api public
 */
module.exports = {
  /**
   * Function to get all created users
   * @param {int} lastNumDays limit results to users that were created in this last number of days
   *                          omit to get all existing users ever created
   * @param {function} callback
   * @return {void}
   */
  getUsers: function(lastNumDays, callback) {
    var options = {
      uri: URL + '/users',
      json: true,
      auth: auth
    };

    if (lastNumDays && lastNumDays >= 0) {
      options.qs = {
        'created_since': lastNumDays
      };
    }

    getData('users', null, options, function(err, res) {
      if (err) {
        callback(err);
        return;
      }

      // res.on('data', function(data) {
      //   console.log(data);
      // });
      // res.on('end', function() {
      //   console.log('FETCHED USERS');
      // });
      callback(null, res);
      return;
    });
  },

  /**
   * Function to get created users by segment
   * @param {string} segment Case-senstive name of segment to query for in Users
   * @param {int} lastNumDays limit results to users that were created in this last number of days
   *                          omit to get all existing users ever created
   * @param {function} callback
   * @return {void}
   */
  getUsersBySegment: function(segment, lastNumDays, callback) {
    // console.log(getData);
    if (!segment) {
      callback('NO SEGMENT PROVIDED');
      return;
    }

    var validSegmentsID = {};

    var fetchUsers = function() {
      // console.log(segment, segment in validSegmentsID);
      if (!(segment in validSegmentsID)) {
        callback('SEGMENT PROVIDED DOES NOT EXIST');
        return;
      }

      var userOptions = {
        uri: URL + '/users',
        json: true,
        auth: auth,
        qs: {
          'segment_id': validSegmentsID.segment
        }
      };

      if (lastNumDays && lastNumDays >= 0) {
        userOptions.qs.created_since = lastNumDays;
      }

      getData('users', null, userOptions, function(err, res) {
        if (err) {
          throw new Error(err);
        }

        // res.on('data', function(data) {
        //   console.log(data);
        // });
        // res.on('end', function() {
        //   console.log('FETCHED USERS BY SEGMENT');
        // });

        callback(null, res);
        return;
      });
    };

    var segmentOptions = {
      uri: URL + '/segments',
      json: true,
      auth: auth
    };

    getData('segments', null, segmentOptions, function(err, res) {
      if (err) {
        callback(err);
        return;
      }

      res.on('data', function(data) {
        data.forEach(function(entry) {
          validSegmentsID[entry.name] = entry.id;
        });
      });
      res.on('end', function() {
        // console.log(validSegmentsID);
        fetchUsers();
      });
    });
  }
};
