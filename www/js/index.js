Math.clamp = function(val, min, max){
    return Math.min(Math.max(min, val), max);
};

// https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
Math.range = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

const DEBUG_MODE = false;

let app = null;

class App {

    constructor() {
        $('#app').hide();
        $('#popup').hide();
        if(!DEBUG_MODE) {
            $('#debug').hide();
        }
        this.watch = null;
        this.lastMeasures = [];
        this.numTouches = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        this.popupOpen = true;
        this.bindEvents();
    }

    bindEvents() {
        this.onDeviceReady = this.onDeviceReady.bind(this);
        this.accSuccess = this.accSuccess.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.recalibrateAccelerometer = this.recalibrateAccelerometer.bind(this);
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('touchstart', this.onTouchStart, false);
        document.addEventListener('touchend', this.onTouchEnd, false);
    }

    onDeviceReady() {
        let parentElement = document.getElementById('deviceready');
        let listeningElement = parentElement.querySelector('.listening');
        let receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        window.plugins.insomnia.keepAwake();

        this.run();
    }

    onTouchStart(e) {
        if(e.touches.length > this.numTouches) {
            this.numTouches = e.touches.length;
        }
    }

    onTouchEnd(e) {
        if(e.touches.length === 0) {
            if(this.numTouches === 2) {
                this.recalibrateAccelerometer();
            }
            this.numTouches = 0;
        }
    }

    recalibrateAccelerometer() {
        if(this.popupOpen) {
            $('#popup').hide();
            this.popupOpen = false;
        }
        let acceleration = this.lastMeasures[this.lastMeasures.length-1];
        this.xOffset = -(acceleration.x);
        this.yOffset = -(acceleration.y);
    }

    run() {
        $('#load').hide();
        $('#app').show();
        $('#popup').show();
        let options = {frequency: 40};
        this.watch = navigator.accelerometer.watchAcceleration(this.accSuccess, this.accError, options);
    }

    accSuccess(acceleration) {
        $('#x').text(acceleration.x + this.xOffset);
        $('#y').text(acceleration.y + this.yOffset);
        $('#z').text(acceleration.z);
        if(this.lastMeasures.length > 4) {
            this.lastMeasures.shift();
        }
        this.lastMeasures.push(acceleration);
        let x = (this.lastMeasures.reduce((acc, cur) => acc + cur.x, 0) / this.lastMeasures.length) + this.xOffset;
        let y = (this.lastMeasures.reduce((acc, cur) => acc + cur.y, 0) / this.lastMeasures.length) + this.yOffset;
        let z = this.lastMeasures.reduce((acc, cur) => acc + cur.z, 0) / this.lastMeasures.length;
        let m = -99 / -19.62;
        let xMargin = Math.clamp(49.5 + (m * x), 0, 99);
        let yMargin = Math.clamp(49.5 - (m * y), 0, 99);
        $('#xBarInner').css('margin-left', xMargin + '%');
        $('#yBarInner').css('margin-left', yMargin + '%');
        $('#circleInner')
            .css('margin-left', xMargin + '%')
            .css('margin-top', yMargin + '%');
        let mDeg = 180 / 19.62;
        let xDeg = (mDeg * x).toFixed(1);
        let yDeg = (mDeg * y).toFixed(1);
        let xColor = Math.range(Math.clamp(Math.abs(xDeg), 0, 10), 0, 10, 100 ,0);
        let yColor = Math.range(Math.clamp(Math.abs(yDeg), 0, 10), 0, 10, 100 ,0);
        $('#xText')
            .text(xDeg + '°')
            .css('color', `hsl(${xColor}, 100%, 35%)`);
        $('#yText')
            .text(yDeg + '°')
            .css('color', `hsl(${yColor}, 100%, 35%)`);
    }

    accError() {
        alert('Error!');
    }

}

function onAllAssetsLoaded() {
    app = new App();
}

window.onload = onAllAssetsLoaded;
