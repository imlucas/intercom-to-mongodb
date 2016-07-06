var intercomApiWrapper = require('../lib/index.js');
// var assert = require('assert');
var expect = require('chai').expect;
// var should = require('chai').should;
// var sinon = require('sinon');

// console.log(intercomApiWrapper.getUsers)
// console.log(intercomApiWrapper.getUsers(1));
// console.log(intercomApiWrapper.getUsersBySegment)


describe('intercom-api-wrapper', function() {
  it('should exist', function() {
    expect(intercomApiWrapper).to.exist;
  });

  it('should return a stream', function() {
    expect(intercomApiWrapper.getUsers, 1).to.be.a('stream');
  });

  it('should throw no segment provided error', function() {
    expect(intercomApiWrapper.getUsersBySegment).to.throw(/NO SEGMENT PROVIDED/);
  });

  it('should throw segment does not exist error', function() {
    expect(intercomApiWrapper.getUsersBySegment, 'bad segment').to.throw(/SEGMENT PROVIDED DOES NOT EXIST/);
  });

  it('should throw segment does not exist error', function() {
    expect(intercomApiWrapper.getUsersBySegment, 1).to.throw(/SEGMENT PROVIDED DOES NOT EXIST/);
  });

  it('should throw segment does not exist error', function() {
    expect(intercomApiWrapper.getUsersBySegment, 'bad segment', 1).to.throw(/SEGMENT PROVIDED DOES NOT EXIST/);
  });

  it('should return a stream', function() {
    expect(intercomApiWrapper.getUsersBySegment('Active', 1)).to.be.a('stream');
  });
});
