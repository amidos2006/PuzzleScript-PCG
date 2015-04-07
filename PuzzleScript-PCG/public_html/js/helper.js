/* 
 * Helper
 * Author: Ahmed Abdel Samea Khalifa
 * 
 * All Helper Functions are here
 */

// Reference: 
// http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
Array.prototype.shuffle = function() {
    var currentIndex = this.length
    , temporaryValue
    , randomIndex
    ;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.randomInt(currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = this[currentIndex];
        this[currentIndex] = this[randomIndex];
        this[randomIndex] = temporaryValue;
    }
    return this;
};

// Reference: 
// http://stackoverflow.com/questions/18417728/get-the-array-index-of-duplicates
Array.prototype.getDuplicates = function () {
    var duplicates = {};
    for (var i = 0; i < this.length; i++) {
        if(duplicates.hasOwnProperty(this[i])) {
            duplicates[this[i]].push(i);
        } else if (this.lastIndexOf(this[i]) !== i) {
            duplicates[this[i]] = [i];
        }
    }

    return duplicates;
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.indicesOf = function(element) {
	var indices = [];
	for (var i=0; i <this.length; i++) {
		if (this[i] === element) {
			indices.push(i);
		}
	}

	return indices;
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.max = function() {

	return Math.max.apply(null, this);
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.min = function() {

	return Math.min.apply(null, this);
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.sum = function() {

	var sum = 0;
	for (var i=0; i < this.length; i++) {
		sum += this[i];
	}

	return sum;
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.avg = function() {

	if (this.length === 0) {
		return 0;
	}
	return parseFloat(this.sum())/this.length;
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.variance = function () {
	var sumOfSquares = 0;
	var mean = this.avg();
	var n = parseFloat(this.length);

	for (var i=0; i < this.length; i++) {
		// console.log("Math.pow(this[%s] - mean, 2)=%s", i, Math.pow(this[i] - mean, 2));
		sumOfSquares += Math.pow(this[i] - mean, 2);
	}

	return sumOfSquares/(n-1);
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.sd = function() {
    return Math.sqrt(this.variance());
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.se = function() {
    return Math.sqrt(this.variance()/this.length);
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Array.prototype.rand = function() {
    if (this.length >= 0) {
        return this[Math.floor(Math.random() * this.length)];
    }
};

Array.prototype.nonZeroCount = function(){
    var count = 0;
    for (var i = 0; i < this.length; i++) {
        if(this[i] > 0){
            count++;
        }
    }
    return count;
};

Array.prototype.clone = function(){
    return this.map(function(obj){ return obj; });
};

Array.prototype.isEqual = function(array){
    if(this.length !== array.length){
        return false;
    }
    
    for (var i = 0; i < this.length; i++) {
        if(this[i] !== array[i]){
            return false;
        }
    }
    
    return true;
};

// Reference:
// https://github.com/icelabMIT/PuzzleScriptAI/blob/master/js/simulator.js
Math.randomInt = function(max){
    return Math.floor(Math.random() * max);
};

Math.getPoint = function(number, height){
    var point = {};
    point["x"] = Math.floor(number / height);
    point["y"] = number % height;
    
    return point;
};

Math.getGaussianScore = function(x, mean, sd){
    return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2)));
};