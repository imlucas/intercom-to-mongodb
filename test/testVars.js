var URL = 'https://api.intercom.io';
var auth = {
  'user': process.env.INTERCOM_APP_ID,
  'pass': process.env.INTERCOM_API_KEY
};

module.exports = {
  /* Different options that request.get can receive as arguments
   * Used to set up request.get stubbing correctly and return sensible results
   */
  usersOptions: {
    uri: URL + '/users',
    json: true,
    auth: auth
  },

  usersCreatedSinceOptions: {
    uri: URL + '/users',
    json: true,
    auth: auth,
    qs: {'created_since': 1}
  },

  usersBySegmentOptions: {
    uri: URL + '/users',
    json: true,
    auth: auth,
    qs: {'segment_id': 0}
  },

  segmentsOptions: {
    uri: URL + '/segments',
    json: true,
    auth: auth
  },

  countOptions: {
    uri: URL + '/counts',
    json: true,
    auth: auth,
    qs: { 'type': 'user', 'count': 'segment' }
  },

  // Sample response body that Intercom will return with /segments
  segmentsOutput: {
    'segments': [
      { id: 0, name: 'test' }
    ]
  },

  // Sample response body that Intercom will return with /users
  usersOutput: {
    'users': [
      {'type': 'user',
      'id': '530370b477ad7120001d',
      'user_id': '25',
      'email': 'wash@serenity.io',
      'name': 'Hoban Washburne',
      'updated_at': 1392734388,
      'last_seen_ip': '1.2.3.4',
      'unsubscribed_from_emails': false,
      'last_request_at': 1397574667,
      'signed_up_at': 1392731331,
      'created_at': 1392734388,
      'session_count': 179,
      'user_agent_data': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9',
      'pseudonym': null,
      'anonymous': false}
    ]
  },

  // Sample response body that Intercom will return with /counts
  countsOutput: {
    'segment': [
      { 'test': 0 }
    ]
  }
};
