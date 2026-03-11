window.HELP_IMPROVE_VIDEOJS = false;

function fmtTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  var m = Math.floor(s / 60);
  s = Math.floor(s % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

$(document).ready(function() {
    $(".navbar-burger").click(function() {
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
    });

    bulmaSlider.attach();

    // ===== Sync video groups =====
    document.querySelectorAll('.comparison-group').forEach(function(group) {
      var videos = Array.from(group.querySelectorAll('.sync-video'));
      var playBtn = group.querySelector('.sync-play-btn');
      var progressWrap = group.querySelector('.sync-progress-wrap');
      var progressBar = group.querySelector('.sync-progress-bar');
      var timeLabel = group.querySelector('.sync-time');
      var isPlaying = false;
      var dragging = false;

      function getMasterDuration() {
        var d = Infinity;
        videos.forEach(function(v) {
          if (v.duration && isFinite(v.duration) && v.duration < d) d = v.duration;
        });
        return isFinite(d) ? d : 0;
      }

      function doPlay() {
        videos.forEach(function(v) {
          var p = v.play();
          if (p && p.catch) p.catch(function(){});
        });
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }

      function doPause() {
        videos.forEach(function(v) { v.pause(); });
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }

      function doSeek(t) {
        videos.forEach(function(v) { v.currentTime = t; });
      }

      // Play/pause toggle
      playBtn.addEventListener('click', function() {
        if (isPlaying) doPause(); else doPlay();
      });

      // Progress bar: click to seek
      function seekFromMouse(e) {
        var rect = progressWrap.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        var dur = getMasterDuration();
        if (dur > 0) doSeek(ratio * dur);
      }

      progressWrap.addEventListener('mousedown', function(e) {
        e.preventDefault();
        dragging = true;
        doPause();
        seekFromMouse(e);
      });
      window.addEventListener('mousemove', function(e) {
        if (dragging) seekFromMouse(e);
      });
      window.addEventListener('mouseup', function() {
        if (dragging) { dragging = false; doPlay(); }
      });

      // Periodic sync + progress update (every 100ms)
      setInterval(function() {
        var dur = getMasterDuration();
        if (dur <= 0) return;

        var master = videos[0];
        var t = master.currentTime;

        // Re-sync followers
        for (var i = 1; i < videos.length; i++) {
          if (Math.abs(videos[i].currentTime - t) > 0.2) {
            videos[i].currentTime = t;
          }
        }

        // Loop
        if (t >= dur - 0.15) {
          doSeek(0);
          if (isPlaying) doPlay();
        }

        // Update progress bar
        progressBar.style.width = ((t / dur) * 100) + '%';
        timeLabel.textContent = fmtTime(t) + ' / ' + fmtTime(dur);
      }, 100);

      // Auto-start: try playing once video data is available
      var tryPlay = setInterval(function() {
        var allReady = videos.every(function(v) { return v.readyState >= 2; });
        if (allReady) {
          clearInterval(tryPlay);
          doSeek(0);
          doPlay();
        }
      }, 200);
    });

    // ===== Gallery videos =====
    var galleryObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var v = entry.target.querySelector('video');
        if (!v) return;
        if (entry.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function(){});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.gallery-item').forEach(function(item) {
      galleryObserver.observe(item);
    });
});
