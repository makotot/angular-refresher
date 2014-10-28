(function (angular) {

  var ngModule = angular.module('refresher', []);

  ngModule
    .factory('refresher', ['$document', '$http', '$q', '$timeout', function ($document, $http, $q, $timeout) {
      var $el = angular.element,
        $spinner = $el('<div class="refresher-spinner--circle"><div class="refresher-spinner--circle__inner"></div></div>'),
        hasTouchSupport = 'ontouchstart' in window,
        touchEvent = {
          start: hasTouchSupport ? 'touchstart' : 'mousedown',
          move: hasTouchSupport ? 'touchmove' : 'mousemove',
          end: hasTouchSupport ? 'touchend' : 'mouseup'
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
          this.positionY = hasTouchSupport ? ev.targetTouches[0].pageY : ev.pageY;
          this.isClickEvent = true;

          elem.on('click', preventEvent);

          elem.addClass('refresher--no-transition');

          var self = this;

          elem
            .on(touchEvent.move, function (e) {
              self.move(this, e, elem);
            })
            .on(touchEvent.end, function (e) {
              self.endPull(this, e, elem);
              self.render(attr, scope, elem);
            });
        },

        move: function (target, ev, elem) {
          this.isClickEvent = false;

          var distance = ((hasTouchSupport ? ev.targetTouches[0].pageY : ev.pageY) - this.positionY);

          if (distance < 0) {
            this.cancel(elem, target);
            return;
          }

          this.translateY(target, distance);
        },

        endPull: function (target, ev, elem) {
          this.cancel(elem, target);

          elem.removeClass('refresher--no-transition');

          if (this.isClickEvent) {
            elem.off('click', preventEvent);
          }
        },

        cancel: function (elem, target) {
          this.translateY(target, 0);
          elem.off(touchEvent.move)
            .off(touchEvent.end);
        },

        translateY: function (target, y) {
          $el(target).css({
            'webkit-transform': 'translate3d(0, ' + y + 'px, 0)',
            'moz-transform': 'translate3d(0, ' + y + 'px, 0)',
            'ms-transform': 'translate3d(0, ' + y + 'px, 0)',
            'o-transform': 'translate3d(0, ' + y + 'px, 0)',
            'transform': 'translate3d(0, ' + y + 'px, 0)'
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
        compile: function (elem, attrs) {
          elem.addClass('refresher');

          return function (scope, elem, attrs) {
            refresher.render(attrs, scope, elem, attrs);
            refresher.attachEvent(attrs, scope, elem);

            scope.$on('refresher.load', function (ev, data) {
              scope.refresherItems = data;
            });
          };
        }

      };
    }]);

})(window.angular);

