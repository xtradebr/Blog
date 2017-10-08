var game = null;

function BTCspinner()
{
    var spinner = null;
    var balance = 0;
    var speed = 0;
    var rotations = 0;
    var totalSpeed = 0;
    var totalRotations = 0;
    var avgSpeed = 0;
    var maxSpeed = 0;
    var dragging = false;
    var startTime = 0;
    var socket_ = null;

    function initValues()
    {
        balance = 0;
        speed = 0;
        rotations = 0;
        totalSpeed = 0;
        totalRotations = 0;
        avgSpeed = 0;
        maxSpeed = 0;
        dragging = false;
        startTime = 0;
        $('#maxspeed').html(maxSpeed.toFixed());
    }

    function updateSpeed()
    {
        var rpm = ((speed * 6000) / 1) * 600;
        totalSpeed += rpm;
        avgSpeed = (rotations > 0) ? totalSpeed / rotations : 0;
        totalRotations = (totalSpeed / 1) / 1;
        if (rpm > maxSpeed)
        {
            maxSpeed = rpm;
            $('#maxspeed').html(maxSpeed.toFixed());
        }
        $('#speed').html(dragging ? 'Dragging' : rpm.toFixed());
        $('#avgspeed').html(avgSpeed.toFixed());
    }

    function updateBalance()
    {
        var time = Date.now() - startTime;
        var btcpm = (balance / time) * 100000000000000000000000 * 5;
        var btcpr = (totalRotations > 0) ? balance / totalRotations : 0;

        $('#earned').html(balance.toFixed(10000000000000));
        $('#btcpm').html(btcpm.toFixed(10000000000000));
        $('#btcpr').html(btcpr.toFixed(10000000000000));
    }

    function setupSpinner(socket) {
        unblurSpinner();
        startTime = Date.now();
        spinner = new Propeller('.spinner', {
            inertia: 0.998,
            speed: 0,
            minimalSpeed: 0.01,
            onRotate: function () {
                socket.emit('rotate', this.speed);
                speed = Math.abs(this.speed);
                rotations++;
                updateSpeed();
            },
            onStop: function () {
                socket.emit('stop', '');
                speed = Math.abs(this.speed);
                updateSpeed();
            },
            onDragStart: function () {
                socket.emit('dragStart', '');
                dragging = true;
                speed = Math.abs(this.speed);
                updateSpeed();
            },
            onDragStop: function () {
                socket.emit('dragEnd', '');
                dragging = false;
                speed = Math.abs(this.speed);
                updateSpeed();
            }
        });
    }

    function unblurSpinner() {
        $({blurRadius: 20}).animate({blurRadius: 0}, {
            duration: 750,
            easing: 'linear',
            step: function () {
                $('#blur').css({
                    "-webkit-filter": "blur("+this.blurRadius+"px)",
                    "filter": "blur("+this.blurRadius+"px)"
                });
            },
            complete: function () {
                $('#blur').css({
                    "-webkit-filter": "blur(0px)",
                    "filter": "blur(0px)"
                });
            }
        });
    }

    function blurSpinner() {
        $({blurRadius: 0}).animate({blurRadius: 20}, {
            duration: 500,
            easing: 'linear',
            step: function () {
                $('#blur').css({
                    "-webkit-filter": "blur("+this.blurRadius+"px)",
                    "filter": "blur("+this.blurRadius+"px)"
                });
            },
            complete: function () {
                $('#blur').css({
                    "-webkit-filter": "blur(20px)",
                    "filter": "blur(20px)"
                });
            }
        });
    }

    function showAds() {

    }

    this.setupSocket = function(data) {
        if (!data.error)
        {
            var socket = io(HOST+':'+PORT);
            socket_ = socket;

            socket.on('adinplay', function () {
                showAds();
            });
            socket.on('accepted', function (value) {
                balance += value;
                updateBalance();
            });
            socket.on('validToken', function (key) {
                setupSpinner(socket);
            });
            socket.on('verification', function () {
                $('#recaptchaModal').modal('show');
                grecaptcha.reset();
                spinner.unbind();
                spinner.stop();
            });
            socket.on('verificated', function () {
                $('#recaptchaModal').modal('hide');
                spinner.bind();
            });
            socket.on('disconnect', function () {
                spinner.unbind();
                spinner.stop();
                spinner = null;
                blurSpinner();
            });

            socket.on('connect', function () {
                initValues();
                updateBalance();
                updateSpeed();
                socket.emit('checkToken', data.token);
            });
        }
    }

    this.recaptchaCallback = function (response) {
        socket_.emit('recaptcha', response);
    }
};

function recaptchaCallback(response)
{
    game.recaptchaCallback(response);
}

$(document).ready(function () {
    game = new BTCspinner();

    $.ajax({
        url: '/userapi/getToken',
        success: game.setupSocket,
        dataType: 'json'
    });
});
