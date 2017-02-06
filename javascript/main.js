var blipp = require('blippar').blipp;

blipp.getPeel()
  .setOrientation('portrait')
  .setType('fit')
  .setScale(100)
  .setOffset(0, 0);

var scene = blipp.addScene('default');
var mW = blipp.getMarker().getWidth();
var mH = blipp.getMarker().getHeight();
var sW = blipp.getScreenWidth() * 1.003;
var sH = blipp.getScreenHeight() * 1.004;

var hasFoundCrock = false;
var hasFoundBrocc = false;

scene.on('create', function() {
  console.log('mW: ' + mW);
  console.log('mH: ' + mH);
  console.log('sW: ' + sW);
  console.log('sH: ' + sH);
  scene.startTime = new Date();
  scene.foundCrock = scene.addSprite('found_crock.png')
    .setScale(mW, mH)
    .setAlpha(0)
    .setHidden(true);
  scene.foundBrocc = scene.addSprite('found_broccoli.png')
    .setScale(mW, mH)
    .setAlpha(0)
    .setHidden(true);
});

scene.on('show', function() {
  scene.animate()
    .duration(1000)
    .on('end', turnOnTracking);
});

function turnOnTracking() {
  scene.on('track', function() {
    findCrock();
  });
}

blipp.onScanningData = function(jsonText) {
  var recoObject = JSON.parse(jsonText);
  var names = recoObject.map(function(entity) {
    if (entity.name === 'container' ||
        entity.name === 'sign'
       ) {
      findCrock();
    }
    if ((entity.name === 'Broccoli' ||
         entity.name === 'herb' ||
         entity.name === 'vegetable')
         && hasFoundCrock
         && !hasFoundBrocc
       ) {
           findBrocc();
         }
    return entity.name;
  });
  console.log(names);
};

function findCrock() {
  if (!hasFoundCrock) {
  scene.foundCrock.setHidden(false);
  scene.foundCrock.animate()
    .alpha(1)
    .duration(1000)
    .on('end', function() {
      scene.foundCrock.animate()
        .alpha(0)
        .delay(3000)
        .duration(1000)
        .on('end', function() {
          hasFoundCrock = true;
        });
    });
  }
}

function findBrocc() {
  scene.foundBrocc.setHidden(false);
  scene.foundBrocc.animate()
    .alpha(1)
    .duration(1000)
    .on('end', function() {
      scene.foundBrocc.animate()
        .alpha(0)
        .delay(2000)
        .duration(1000)
        .on('end', function() {
          if (!hasFoundBrocc) {
            hasFoundBrocc = true;
            blipp.goToURL('http://www.countrycrock.com/recipes/detail/50881/1/simply-sauteed-vegetables',
              {
                callback: function() {
                  blipp.close();
                }
              }
            );
          }
        });
    });
}