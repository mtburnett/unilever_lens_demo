'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var blipp = require('blippar').blipp;
var sendAnalytics = require('./Utils').sendAnalytics;
var scene = blipp.getScene();

var VS = function () {
  function VS(stack) {
    var _this = this;

    var lensName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'default';

    _classCallCheck(this, VS);

    this.lastBwIds = [];
    this.pauseSpawning = false;
    this.queueAnimator = scene.addTransform();
    this.repeatAfter = 5;
    this.queued = {
      bwIds: [],
      bodies: []
    };
    this.lastAddedAt = -1;
    this.stack = stack;
    this.firstScan = false;
    this.getMinimumTime = function () {
      return 6000 * Math.max(0.1, _this.stack.parsedCode.nbOfBubble / 5);
    };
  }

  _createClass(VS, [{
    key: 'separateResponse',
    value: function separateResponse(scanningResponse) {
      if (!this.firstScan) {
        this.firstScan = true;
        sendAnalytics('20047', 'Scanning Started');
      }
      return this.groupBy(scanningResponse, function (v) {
        return [v.blippserve];
      });
    }
  }, {
    key: 'newFaces',
    value: function newFaces(faceList) {
      faceList = this.filterBwIds(faceList);
      if (faceList.length) {
        blipp.log('getting faces the right way');
        this.stack.Content.getFaceDataDisplay(faceList);
      }
    }
  }, {
    key: 'newBwIds',
    value: function newBwIds(bwIdList) {
      var _this2 = this;

      bwIdList = this.filterBwIds(bwIdList);
      if (bwIdList.length) {
        (function () {
          blipp.info(bwIdList.length + ' new bwids being added');
          var bwIds = [];
          var faces = [];
          bwIdList.forEach(function (v) {
            if (v[0] == v[1].displayname) {
              faces.push([v[0], v[1]]);
            } else {
              bwIds.push([v[0], v[1]]);
            }
          });
          if (bwIds.length) {
            bwIds = bwIds.filter(function (v) {
              if (v[0].length == 32 || v[0].slice(0, 3) == 'bw:') {
                return true;
              } else {
                blipp.error('unrecognised bwId: ' + v[0]);
                return false;
              }
            });
            if (_this2.stack.parsedCode.nbOfBubble === 0) {
              bwIds.map(function (v) {
                _this2.stack.VS.addToQueue({
                  name: v[1].displayname,
                  bwId: v[0],
                  iconImg: v[1].thumbnailurl,
                  addedAt: scene.getTime()
                });
              });
            } else {
              _this2.stack.Content.getDataDisplay(bwIds.map(function (w) {
                return w[0];
              }));
            }
          }
          if (faces.length) {
            blipp.info('getting faces the wrong way');
            _this2.stack.Content.getFaceDataDisplay(faces);
          }
        })();
      }
      return bwIdList.length;
    }
  }, {
    key: 'setPauseSpawning',
    value: function setPauseSpawning(value) {
      if (this.pauseSpawning !== value) {
        blipp.log('spawning paused ' + value);
        this.pauseSpawning = value;
        this.queueAnimator.getAnimations().map(function (v) {
          return v.stop();
        });
        if (!value) {
          this.restartSpawning();
        }
      } else {
        blipp.log('spawning paused already ' + value);
      }
    }
  }, {
    key: 'restartSpawning',
    value: function restartSpawning() {
      var _this3 = this;

      var minDelay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      blipp.log('restarting spawning: ' + this.queued.bwIds.length);
      // this.queueAnimator.stopAllAnimations();
      this.queued.bwIds.map(function (v, i) {
        blipp.log('found a bwid, animating');
        blipp.log(i * _this3.getMinimumTime() + minDelay);
        _this3.queueAnimator.animate().duration(i * _this3.getMinimumTime() + minDelay).on('end', function () {
          blipp.log('animation finished, spawn now pls');
          if (scene.getTime() - _this3.lastAddedAt > _this3.getMinimumTime() && !_this3.pauseSpawning) {
            _this3.createBoxOnStack();
          }
        });
      });
    }
  }, {
    key: 'getWordList',
    value: function getWordList(jsonResponse) {
      if (typeof jsonResponse == 'string') {
        jsonResponse = JSON.parse(jsonResponse);
      }
      var groupedResponse = this.separateResponse(jsonResponse);
      if ('tag' in groupedResponse) {
        return groupedResponse.tag.map(function (v) {
          return v.displayname;
        });
      } else {
        return [];
      }
    }
  }, {
    key: 'getBwIds',
    value: function getBwIds(rawResponse) {
      var groupedResponse = this.separateResponse(rawResponse);
      if ('user' in groupedResponse) {
        blipp.log('users recognised');
        this.newFaces(groupedResponse.user.map(function (v) {
          return [v.id.replace('bw__', ''), v];
        }));
      }
      var iconResponse = groupedResponse.icon;
      if (iconResponse !== undefined) {
        return iconResponse.map(function (v) {
          return [v.id.replace('bw__', ''), v];
        });
      } else {
        return [];
      }
    }
  }, {
    key: 'vsResponseToStack',
    value: function vsResponseToStack(vsResponse) {
      return this.newBwIds(this.getBwIds(vsResponse));
    }
  }, {
    key: 'groupBy',
    value: function groupBy(array, f) {
      var groups = {};
      array.forEach(function (o) {
        f(o).map(function (v) {
          groups[v] = groups[v] || [];
          groups[v].push(o);
        });
      });
      return groups;
    }
  }, {
    key: 'filterBwIds',
    value: function filterBwIds(bwIdList) {
      var _this4 = this;

      return bwIdList.filter(function (v) {
        if (!_this4.lastBwIds.slice(0, _this4.repeatAfter).includes(v[0]) && !_this4.queued.bwIds.includes(v[0])) {
          _this4.lastBwIds.unshift(v[0]);
          return true;
        }
      });
    }
  }, {
    key: 'addToQueue',
    value: function addToQueue(body) {
      blipp.info('adding to queue');
      if (body.type == 'bespoke' || body.type == 'face') {
        // skips the queue
        this.queued.bwIds.unshift(body.bwId);
        this.queued.bodies.unshift(body);
      } else {
        this.queued.bwIds.push(body.bwId);
        this.queued.bodies.push(body);
      }
      if (this.queued.bwIds.length > 1 || this.pauseSpawning) {
        this.keepShowingChildren = true;
        blipp.log('adding bwid ' + body.name + ' to queue');
      } else {
        if (scene.getTime() - this.lastAddedAt > this.getMinimumTime() || this.lastAddedAt == -1) {
          this.keepShowingChildren = false;
          blipp.info('no queue for: ' + body.name);
          this.createBoxOnStack();
        } else {
          this.keepShowingChildren = true;
          blipp.info('starting queue for ' + body.name + ' because\nstart time: ' + scene.getTime() + '\nlastAddedAt: ' + this.lastAddedAt);
        }
      }
      if (this.keepShowingChildren && !this.pauseSpawning) {
        this.spawnAgain();
      } else if (this.keepShowingChildren) {
        blipp.log('pause spawning active');
      }
    }
  }, {
    key: 'spawnAgain',
    value: function spawnAgain() {
      var _this5 = this;

      this.queueAnimator.animate().duration(this.getMinimumTime() * this.queued.bwIds.length + (scene.getTime() - this.lastAddedAt)).on('end', function () {
        blipp.log('spawn again anim ended');
        if (scene.getTime() - _this5.lastAddedAt > _this5.getMinimumTime()) {
          if (_this5.stack) {
            if (_this5.stack.touchEvents.scrollPage || _this5.stack.touchEvents.unfold) {
              blipp.log('not respawning because:\n' + _this5.stack.touchEvents.scrollPage + '\n' + _this5.stack.touchEvents.unfold);
              _this5.queueAnimator.animate().duration(1000).on('end', function () {
                _this5.spawnAgain();
              });
              return 0;
            }
          }
          _this5.createBoxOnStack();
        } else {
          blipp.log('calling again, time not enough');
          _this5.queueAnimator.animate().duration(_this5.getMinimumTime()).on('end', function () {
            _this5.spawnAgain();
          });
        }
      });
    }
  }, {
    key: 'spawnNext',
    value: function spawnNext(delay) {
      if (scene.getTime() - this.lastAddedAt > 500 && this.stack.boxStack[0].boxObject.leftToAnimate === 0) {
        this.lastAddedAt = -1;
        this.restartSpawning(delay);
      } else if (scene.getTime() - this.lastAddedAt <= 500) {
        blipp.log('spawning not continued: spawn time not sufficient');
      } else {
        blipp.log('left to animate too high ' + this.stack.boxStack[0].boxObject.leftToAnimate);
      }
    }
  }, {
    key: 'createBoxOnStack',
    value: function createBoxOnStack(body) {
      blipp.log('trying to create box!');
      // this if statement stops any boxes being added when explore mode is disabled
      if (!blipp.getApp().getProperty('exploreMode') && this.queued.bodies.type !== 'bespoke') {
        return 0;
      }
      if (this.queued.bwIds.length) {
        if (this.stack.boxStack[0] !== undefined) {
          if (this.stack.boxStack[0].boxObject !== undefined) {
            if (this.stack.boxStack[0].boxObject.leftToAnimate) {
              this.queueAnimator.stopAllAnimations();
              this.stack.boxStack[0].boxObject.speedUpAnims(500, false, true);
              return 0;
            }
          }
        }
        blipp.log('creating card after ' + (scene.getTime() - this.queued.bodies[0].addedAt));
        this.queued.bwIds.shift();
        this.lastAddedAt = scene.getTime();
        scene.BoxStack.createBox(scene.BoxStack).setupDefault(this.queued.bodies.shift(), false, true, 'pCard').showCluster();
        this.stack.saveStackToDevice(2);
      } else {
        blipp.warn('calling createBoxOnStack when empty');
      }
    }
  }]);

  return VS;
}();

exports.VS = VS;