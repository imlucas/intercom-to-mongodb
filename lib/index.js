var debug = require('debug')('import-intercom-to-mongodb');
var request = require('request');
var es = require('event-stream');
var _ = require('highland');

require('dotenv').config();

var URL = 'https://api.intercom.io';
var auth = {
  user: process.env.INTERCOM_APP_ID,
  pass: process.env.INTERCOM_API_KEY
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

  console.log('fetching..', options.uri);

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
        data.forEach(function(d) {
          if (!d._id) {
            d._id = d.id;
            delete d.id;
          }
          stream.write(d);
        });

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
  var accessOptions = { type: 'users' };
  var options = {
    uri: URL + '/users',
    json: true,
    auth: auth
  };

  if (lastNumDays && lastNumDays >= 0) {
    options.qs = {
      created_since: lastNumDays
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

    var accessOptions = { type: 'users' };
    var userOptions = {
      uri: URL + '/users',
      json: true,
      auth: auth,
      qs: {
        segment_id: validSegmentsID[segment]
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

  var accessOptions = { type: 'segments' };
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
    type: type,
    count: count
  };

  var options = {
    uri: URL + '/counts',
    json: true,
    auth: auth,
    qs: {
      type: type,
      count: count
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

function epochToDate(secs) {
  var d = new Date(0);
  d.setUTCSeconds(secs);
  return d;
}

module.exports.TAGS = {};
module.exports.SEGMENTS = {};

var parsers = {
  tag: function(d) {
    d._id = d.id;
    return d;
  },
  segment: function(d) {
    d._id = d.id;
    return d;
  },
  conversation: function(d) {
    d._id = d.id;
    return d;
  },
  event: function(d) {
    d._id = d.id;
    return d;
  },
  admin: function(d) {
    d._id = d.id;
    return d;
  },
  user: function(d) {
    if (!d._id) {
      d._id = d.id;
      delete d.id;
    }

    var doc = {
      _id: d._id,
      coordinates: [
        d.location_data.longitude || 0,
        d.location_data.latitude || 0
      ],
      compass_client_id: d.user_id,
      session_count: d.session_count,
      user_agent_data: d.user_agent_data,
      unsubscribed_from_emails: d.unsubscribed_from_emails,
      marked_email_as_spam: d.marked_email_as_spam,
      has_hard_bounced: d.has_hard_bounced,
      last_request_at: epochToDate(d.last_request_at),
      created_at: epochToDate(d.created_at),
      remote_created_at: epochToDate(d.remote_created_at),
      signed_up_at: epochToDate(d.signed_up_at),
      updated_at: epochToDate(d.updated_at),
      location: {
        city_name: d.location_data.city_name,
        continent_code: d.location_data.continent_code,
        country_name: d.location_data.country_name,
        latitude: d.location_data.latitude,
        longitude: d.location_data.longitude,
        postal_code: d.location_data.postal_code,
        region_name: d.location_data.region_name,
        timezone: d.location_data.timezone,
        country_code: d.location_data.country_code
      },
      tags: d.tags.tags.map(function(t) {
        return module.exports.TAGS[t.id] || t.id;
      }),
      segments: d.segments.segments.map(function(s) {
        return module.exports.SEGMENTS[s.id] || s.id;
      }),
      custom_attributes: d.custom_attributes
    };
    return doc;
  }
};

/* eslint no-console: 0 */

var getStream = function(type, options, stream) {
  var isParent = !stream;
  if (isParent) {
    stream = es.readable(function(count, cb) {
      cb();
    });
  }
  debug('fetching %ss', type, options);
  options.json = true;
  options.auth = auth;

  request.get(options, function(error, response, body) {
    error = error || body.errors;
    var data = body && body[type + 's'];

    if (!data && !error) {
      debug('%ss in body is falsy', type, body);
      error = new Error('No request error but no data!');
    }

    if (error) {
      console.error(error);
      stream.emit('error', error);
      return;
    }

    data.map(parsers[type]).forEach(stream.emit.bind(stream, 'data'));

    if (body.pages && body.pages.next) {
      getStream(
        type,
        {
          uri: body.pages.next
        },
        stream
      );
    } else if (body.scroll_param && data.length) {
      getStream(
        type,
        {
          uri: options.uri,
          qs: {
            scroll_param: body.scroll_param
          }
        },
        stream
      );
    } else {
      debug('completed fetch %ss', type, options);
      stream.emit('end');
    }
  });
  return stream;
};

module.exports.getUserEventsStream = function(intercomUserId) {
  var options = {
    uri: URL + '/events',
    json: true,
    auth: auth,
    qs: {
      type: 'user',
      intercom_user_id: intercomUserId
    }
  };

  return getStream('event', options);
};

module.exports.getUsersScrollStream = function(lastNumDays) {
  var options = {
    uri: URL + '/users/scroll'
  };

  if (lastNumDays) {
    options.qs = {
      created_since: lastNumDays
    };
  }

  return getStream('user', options);
};

module.exports.getUsersStream = function(lastNumDays) {
  var options = {
    uri: URL + '/users'
  };

  if (lastNumDays && lastNumDays >= 0) {
    options.qs = {
      created_since: lastNumDays
    };
  }

  return getStream('user', options);
};

module.exports.getAdminsStream = function(lastNumDays) {
  var options = {
    uri: URL + '/admins',
    json: true,
    auth: auth
  };

  if (lastNumDays && lastNumDays >= 0) {
    options.qs = {
      created_since: lastNumDays
    };
  }

  return getStream('admin', options);
};

module.exports.getEventsStream = function() {
  var options = {
    uri: URL + '/events'
  };
  return getStream('event', options);
};

module.exports.getConversationsStream = function() {
  var options = {
    uri: URL + '/conversations'
  };
  return getStream('conversation', options);
};

module.exports.getTagsStream = function() {
  var options = {
    uri: URL + '/tags'
  };
  return getStream('tag', options);
};

module.exports.getSegmentsStream = function() {
  var options = {
    uri: URL + '/segments'
  };
  return getStream('segment', options);
};
