(function (angular) {

  var ngModule = angular.module('refresher', []);

  ngModule
    .factory('refresher', ['$document', '$http', '$q', '$timeout', function ($document, $http, $q, $timeout) {
      var $el = angular.element,
        $spinner = $el('<div class="refresher-spinner--circle"><div class="refresher-spinner--circle__inner"></div></div>'),
        isTouchSupport = 'ontouchstart' in window,
        touchEvent = {
          start: isTouchSupport ? 'touchstart' : 'mousedown',
          move: isTouchSupport ? 'touchmove' : 'mousemove',
          end: isTouchSupport ? 'touchend' : 'mouseup'
        };

      function preventEvent (ev) {
        return ev.preventDefault();
      }

      return {
        get: function (url) {
          var q = $q.defer();

          $http({
            method: 'GET',
            url: url,
            timeout: 5000
          })
          .success(function (data, status, header, config) {
            q.resolve(data);
          })
          .error(function (data, status, header, config) {
            q.reject();
          });

          return q.promise;
        },

        request: function (attr, scope) {
          var self = this;

          this.get(attr.refresherUrl)
            .then(function (data) {
              $timeout(function () {
                self.remove();
                scope.$emit('refresher.load', data);
              }, attr.refresherTimer || 0);
            });
        },

        render: function (attr, scope, elem) {
          $el(elem).prepend($spinner);

          this.request(attr, scope);
        },

        remove: function () {
          $spinner.remove();
        },

        startPull: function (ev, attr, scope, elem) {
          this.positionY = this.isTouchSupport ? ev.targetTouches[0].pageY : ev.pageY;
          this.isTouchStart = true;

          var self = this;

          if (!isTouchSupport) {
            elem.on('click', preventEvent);
          }

          elem
            .on(touchEvent.move, function (e) {
              self.move(this, e);
            })
            .on(touchEvent.end, function (e) {
              self.endPull(this, e, elem);
              self.render(attr, scope, elem);
            });
        },

        move: function (target, ev) {
          if (!this.isTouchStart) {
            return;
          }

          this.translateY(target, ((this.isTouchSupport ? ev.targetTouches[0].pageY : ev.pageY) - this.positionY));
        },

        endPull: function (target, ev, elem) {
          this.isTouchStart = false;
          this.translateY(target, 0);

          if (!isTouchSupport) {
            elem.off('click', preventEvent);
          }
        },

        translateY: function (target, y) {
          $el(target).css({
            'webkit-transform': 'translate(0, ' + y + 'px)',
            'moz-transform': 'translate(0, ' + y + 'px)',
            'ms-transform': 'translate(0, ' + y + 'px)',
            'o-transform': 'translate(0, ' + y + 'px)',
            'transform': 'translate(0, ' + y + 'px)'
          });
        },


        attachEvent: function (attr, scope, elem) {
          var self = this;

          elem.on(touchEvent.start, function (ev) {
            self.startPull(ev, attr, scope, elem);
          })

          $document.on('visibilitychange', function () {
            self.render(attr, scope, elem);
          });
        }

      };
    }])
    .directive('refresher', ['refresher', function (refresher) {

      return {

        restrict: 'A',
        scope: {
          refresherItems: '='
        },
        link: function (scope, elem, attrs) {
          refresher.render(attrs, scope, elem, attrs);
          refresher.attachEvent(attrs, scope, elem);

          scope.$on('refresher.load', function (ev, data) {
            scope.refresherItems = data;
          });
        }

      };
    }]);

})(window.angular);

