var request = require('request');
var _ = require('highland');
require('dotenv').config();

var URL = 'https://api.intercom.io';
var auth = {
  'user': process.env.INTERCOM_APP_ID,
  'pass': process.env.INTERCOM_API_KEY
};

/**
 * Function to perform a get request with given uri and options, handles pagination recursively and writes all results to the same stream
 * @param {object} accessOptions Object with Type and Count to be accessed in Intercom request
 * @param {stream} stream Stream to write data to
 * @param {object} options Options object for the HTTP request
 * @param {function} callback Callback function to call if error or successful return
 * @return {void}
 */
var getData = function(accessOptions, stream, options, callback) {
  var stream = stream || _(); // eslint-disable-line no-redeclare

  // console.log('fetching..' + options.uri);

  request.get(options, function(error, response, body) {
    if (error || body.errors) {
      callback(error || body.errors);
      return;
    }

    if (+response.statusCode === 200) {
      if (!accessOptions.type) {
        callback('NO TYPE PROVIDED TO UNPACK OBJECT');
        return;
      }
      var data = body[accessOptions.type];
      data = accessOptions.count ? data[accessOptions.count] : data;
      if (data !== null) {
        for (var i = 0; i < data.length; ++i) {
          stream.write(data[i]);
        }

        if (body.pages && body.pages.next) {
          var nextOptions = {
            uri: body.pages.next,
            json: true,
            auth: auth
          };
          getData(accessOptions, stream, nextOptions, callback);
        } else {
          stream.end();
          callback(null, stream);
          return;
        }
      }
    }
  });
};

/**
 * Function to get all created users
 * @param {int} lastNumDays limit results to users that were created in this last number of days
 *                          omit to get all existing users ever created
 * @param {function} callback
 * @return {void}
 */
var getUsers = function(lastNumDays, callback) {
  var accessOptions = { 'type': 'users' };
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

  getData(accessOptions, null, options, function(err, res) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, res);
    return;
  });
};

/**
 * Function to get created users by segment
 * @param {string} segment Case-senstive name of segment to query for in Users
 * @param {function} callback
 * @return {void}
 */
var getUsersBySegment = function(segment, callback) {
  if (!segment) {
    callback('NO SEGMENT PROVIDED');
    return;
  }

  var validSegmentsID = {};

  var fetchUsers = function() {
    if (!(segment in validSegmentsID)) {
      callback('SEGMENT PROVIDED DOES NOT EXIST');
      return;
    }

    var accessOptions = { 'type': 'users' };
    var userOptions = {
      uri: URL + '/users',
      json: true,
      auth: auth,
      qs: {
        'segment_id': validSegmentsID[segment]
      }
    };

    getData(accessOptions, null, userOptions, function(err, res) {
      if (err) {
        throw new Error(err);
      }
      callback(null, res);
      return;
    });
  };

  var accessOptions = { 'type': 'segments' };
  var segmentOptions = {
    uri: URL + '/segments',
    json: true,
    auth: auth
  };

  getData(accessOptions, null, segmentOptions, function(err, res) {
    if (err) {
      callback(err);
      return;
    }

    res.on('data', function(data) {
      validSegmentsID[data.name] = data.id;
    });
    res.on('end', function() {
      fetchUsers();
    });
  });
};

/**
 * Function to get created users by segment
 * @param {string} type find unique entries of this type (conversation, type, or company)
 * @param {string} count count results based on this bucket (admin, segment, tag, or user)
 * @param {function} callback
 * @return {void}
 */
var getCount = function(type, count, callback) {
  if (!type || !count) {
    callback('NO TYPE OR COUNT PROVIDED');
    return;
  }

  var accessOptions = {
    'type': type,
    'count': count
  };

  var options = {
    uri: URL + '/counts',
    json: true,
    auth: auth,
    qs: {
      'type': type,
      'count': count
    }
  };

  getData(accessOptions, null, options, function(err, res) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, res);
    return;
  });
};

/**
 *
 * @api public
 */
module.exports = {
  getUsers: getUsers,
  getUsersBySegment: getUsersBySegment,
  getCount: getCount
};
