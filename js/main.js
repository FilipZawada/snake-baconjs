(function () {
    console.log(""); // skip WebStorm console bug

    //////////////////////////////////////////
    // Utils
    //////////////////////////////////////////

    var mapSize = 10;

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    Point.sum = function (p1, p2) {
        var x = (p1.x + p2.x + mapSize) % mapSize;
        var y = (p1.y + p2.y + mapSize) % mapSize;
        return new Point(x, y);
    };

    Point.random = function () {
        var x = _.random(0, mapSize - 1);
        var y = _.random(0, mapSize - 1);
        return new Point(x, y);
    };

    function SnakeData(head, length) {
        this.head = head;
        this.length = length;
    }

    SnakeData.create = function(head, length) {
        return new SnakeData(head, length);
    };

    SnakeData.append = function (snakeArray, snakeData) {
        snakeArray.push(snakeData.head);
        return snakeArray.slice(-snakeData.length);
    };

    function getMap(width, height) {
        // Array.map() doesn't work on sparse arrays
        return _.map(Array(height), function () {
            return Array(width + 1).join("░").split("");
        });
    }

    function sum(a, b) {
        return a + b;
    }

    var arrowsKeyMap = {
        37: new Point(-1, 0),
        39: new Point(1, 0),
        40: new Point(0, 1),
        38: new Point(0, -1)
    };

    //////////////////////////////////////////
    // Game Core
    //////////////////////////////////////////

    // position of snake's head
    var snakeHead = Bacon.fromEventTarget(document, 'keydown')
        .map('.which')
        .map(_.partial(_.result, arrowsKeyMap))
        .filter(_.isObject)
        .sampledBy(Bacon.interval(100))
        .scan({x: 0, y: 0}, Point.sum);

    // activated when new fruit appear on map
    var fruitBus = new Bacon.Bus();
    fruitBus.plug(Bacon.once());

    // position of currently visible fruit
    var fruit = fruitBus
        .map(Point.random)
        .toProperty(Point.random());

    // number of successful bites ( i.e. number of points; i.e. length of snake)
    var bites = fruit.sampledBy(snakeHead, _.isEqual)
        .filter(_.partial(_.isEqual, true))
        .scan(1, sum);

    // add fruit with every bite
    fruitBus.plug(bites);

    var snake = Bacon.combineWith(SnakeData.create, snakeHead, bites)
                     .scan([], SnakeData.append);

    Bacon.onValues(snake, fruit, bites, display);

    function display(positions, fruit /*, bites*/) {

        var map = getMap(mapSize, mapSize);

        map[fruit.y][fruit.x] = "@";

        positions.forEach(function (pos) {
            map[pos.y][pos.x] = "▓";
        });


        var view = document.getElementById('view');
        view.innerHTML = map.join('\r\n').replace(/,/g, '');
    }
})();