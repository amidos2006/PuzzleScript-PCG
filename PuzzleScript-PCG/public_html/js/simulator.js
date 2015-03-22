/*
* Simulator
* Author: Chong-U Lim
*
* This contains a set of methods and functionality to facilitate the
* automatic playing of games created with PuzzleScript.
*
* This is useful for performing automated playtesting or for scripting
* artificial intelligence (AI) playerrs or bots. 
*/

/* global level, state */

var SIMULATOR_MOVE_LEFT = 1;
var SIMULATOR_MOVE_RIGHT = 3;
var SIMULATOR_MOVE_UP = 0;
var SIMULATOR_MOVE_DOWN = 2;
var SIMULATOR_ACTION = 4;
var SIMULATOR_UNDO = "undo";
var SIMULATOR_RESTART = "restart";

var simulator_make_gif = false;
var silent_tick_count = 10;

var simulation_errors = 0;

function simulator_action_to_keycode(simdir) {
	switch (simdir) {
		case SIMULATOR_MOVE_LEFT: return 65;
		case SIMULATOR_MOVE_RIGHT: return 68;
		case SIMULATOR_MOVE_UP: return 87;
		case SIMULATOR_MOVE_DOWN: return 83;
		case SIMULATOR_UNDO: return 90;
		case SIMULATOR_ACTION: return 88;
	}
}

function simulate_key_press(keyCode) {
	console.log("simulate_key_press(), keyCode=%s", keyCode);
	
	e = $.Event('keydown');
	e.keyCode = keyCode;
	e.target = canvas;
	onKeyDown(e);

	e = $.Event('keyup');
	e.keyCode= keyCode;
	e.target=canvas;
	onKeyUp(e);
}

function simulate_move_left() {
	simulate_key_press(65); // a
}

function simulate_move_right() {
	simulate_key_press(68); // d
}

function simulate_move_down() {
	simulate_key_press(83); // s
}

function simulate_move_up() {
	simulate_key_press(87); // w
}

function simulate_action() {
	simulate_key_press(88); // x
}

function simulate_undo() {
	simulate_key_press(90); // z
}

function simulate_and_get_state(dir) {
	startState = level.dat;
	simulate_key_press(simulator_action_to_keycode(dir));
	endState = level.dat.slice(0);
	console.log('[%o]-(%s)->[%o]', startState, dir, endState);
	DoRestart(true);
	
	return endState;
}

function simulate_down_and_get_state() {
	return simulate_and_get_state(SIMULATOR_MOVE_DOWN);
}

function simulate_input_history() {
	if (inputHistory !== null){
		simulate_solution(inputHistory.slice(0)); // make copy
	}
	else {
		console.log("inputHistory is null.");
	}
}

function inQueue(node, queue) {

	var queueNode = null;
	for (var i=0; i<queue.length; i++)
	{
		queueNode = queue[i];
		if ( isLevelEqual(queueNode[0], node[0]) ) {
			return true;
		}
	}

	return false;
}

function isNodeWinning(node){
	return isLevelWinning(node[0]);
}

function node(state,moves) {
	return [state,moves];
}

function restoreNode(node) {
	restoreLevel(node[0]);
}

// Credits: 
// http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function bestfs_sort(a,b) {
	if (a[1] > b[1]) {
		return 1;
	}
	else if (a[1] < b[1]) {
		return -1;
	}
	else {
		return 0;
	}
}

function get_lowest_cost(nodes) {
	temp = nodes.slice(0);
	temp.sort(bestfs_sort);
	best = temp[0];

	return best;
}

function simulate_silent_ticks() {
	for (var j=0; j < silent_tick_count; j++) {
		processInput(-1,true,false);
	}
}


function bestfs(startState, maxIterations_) {
    numAppRules = 0;
    var open = [ [startState, get_level_score(startState), [], numAppRules] ];
    var closed = {};
    var opened = {};

    opened[open[0].toString()] = true;

    var iteration = 0;
    //var maxIterations = maxIterations_ ? maxIterations_ : 1500;
    var maxIterations = maxIterations_;
    var bestSolution = [];
    var bestScore = get_output_score(open[0]);

    while (open.length > 0) {

        if (iteration >= maxIterations) {
            break;
        }

        t = open[0];
        open.splice(0,1);

        actions = t[2];
        dir = "";
        if (actions.length > 0) {
            dir = actions[actions.length-1];
        }

        opened[t[0].concat(dir).toString()] = false;
        closed[t[0].concat(dir).toString()] = true;

        restoreLevel(t[0]);
        numAppRules = t[3];

        if (isLevelWinning(t[0])) {
            //console.log("found winning state! solution=%s, iterations=%s", t[2], iteration);
            return [1, t[2],iteration, numAppRules];
        }
        
        var dirs = [0,1,2,3,4];
        var dir = -1;
        shuffle(dirs);

        for (var i=0; i<dirs.length; i++)
        {
            dir = dirs[i];
            restoreLevel(t[0]);
            numAppRules = t[3];

            processInput(dir, true, false);

            for (var j=0; j < silent_tick_count; j++) {
                processInput(-1,true,false);
            }

            u2 = t[2].slice(0);	// make copy
            u2.push(dir);

            lvl_temp = backupLevel();
            lvl_score = get_level_score(lvl_temp);

            u = [lvl_temp, lvl_score, u2, numAppRules];
            
            var output_score = get_output_score(lvl_temp);
            if(output_score < bestScore || bestSolution.length === 0){
                bestScore = output_score;
                bestSolution = u2;
            }
            else if(output_score === bestScore && bestSolution.length < u2.length){
                bestScore = output_score;
                bestSolution = u2;
            }

            if (!closed[u[0].concat(dir).toString()] && !opened[u[0].concat(dir).toString()] &&
                !isLevelEqual(u[0],t[0])) {
                opened[u[0].concat(dir).toString()] = true;
                open.push(u);
            }
        }

        open.sort(bestfs_sort);

        iteration++;
    }
    
    return [1 - bestScore, bestSolution, iteration, numAppRules];
}

function doNothing(startState){
    if (isLevelWinning(startState)) {
        return 1;
    }
    return 1 - get_output_score(startState);
}

function greedy(startState, maxIterations_) {
    var currentNode = undefined;
    var nextNode = [startState, get_level_score(startState), []];
    var closed = {};

    var iteration = 0;
    var maxIterations = maxIterations_ ? maxIterations_ : 1500;

    while (nextNode !== undefined) {

            if (iteration >= maxIterations) {
                    break;
            }

            if (iteration % 100 === 0 ) {
                    console.log("\titeration=" + iteration.toString());
            }

            currentNode = nextNode;
            nextNode = undefined;

            actions = currentNode[2];
            dir = "";
            if (actions.length > 0) {
                    dir = actions[actions.length-1];
            }

            closed[currentNode[0].concat(dir).toString()] = true;

            restoreLevel(currentNode[0]);

            if (isLevelWinning(currentNode[0])) {
                    console.log("found winning state! solution=%s, iterations=%s", currentNode[2], iteration);
                    return [currentNode[2],iteration];
            }

            var dirs = [0,1,2,3,4];
            var dir = -1;
            shuffle(dirs);

            var nextNodes = [];
            var bestIndex = -1;
            for (var i=0; i<dirs.length; i++)
            {
                dir = dirs[i];
                restoreLevel(currentNode[0]);

                processInput(dir, true, false);

                for (var j=0; j < silent_tick_count; j++) {
                        processInput(-1,true,false);
                }

                u2 = currentNode[2].slice(0);	// make copy
                u2.push(dir);

                lvl_temp = backupLevel();
                lvl_score = get_level_score(lvl_temp);

                u = [lvl_temp, lvl_score, u2];

                if (!closed[u[0].concat(dir).toString()] && !isLevelEqual(u[0],currentNode[0])) {
                    nextNodes.push(u);
                    if(bestIndex === -1 || u[1] < nextNodes[bestIndex][1]){
                        bestIndex = nextNodes.length - 1;
                    }
                }
            }

            if(nextNodes.length > 0){
                nextNode = nextNodes[bestIndex];
            }

            iteration++;
    }
    console.log("exhausted!");
    return [[], iteration];
}

function randomSolver(startState, maxIterations_) {
    var iteration = 0;
    var maxIterations = maxIterations_ ? maxIterations_ : 1500;
    var currentState = [startState, []];

    for (var iteration = 0; iteration < maxIterations; iteration++) {
        restoreLevel(currentState[0]);

        if (isLevelWinning(currentState[0])) {
                //console.log("found winning state! solution=%s, iterations=%s", currentState[1], iteration);
                return [1, currentState[1], iteration];
        }
        
        var dirs = [0,1,2,3,4];
        var dir = dirs.rand();
        
        processInput(dir, true, false);

        for (var j=0; j < silent_tick_count; j++) {
            processInput(-1,true,false);
        }

        lvl_temp = backupLevel();
        u2 = currentState[0].slice(0);
        
        if(!isLevelEqual(lvl_temp, currentState[0]))
        {
            u2.push(dir);
        }
        
        currentState = [lvl_temp, u2];
    }
    
    //console.log("exhausted!");
    return [0, [], iteration];
}

function bfs(startState, maxIterations_) {

	var queue = [ [startState,[]] ];
	var visited = {};

	visited[startState.toString()] = true;

	var iteration = 0;
	var maxIterations = maxIterations_ ? maxIterations_ : 1000;

	while (queue.length > 0) {
		// console.log("iteration:%s", iteration);

		//console.log("before, queue.length=%s, queue=%o", queue.length, queue);

		if (iteration % 100 === 0 ) {
			console.log("\titeration=%s", iteration);
		}

		if (iteration >= maxIterations) {
			break;
		}

		t = queue[0];
		queue.splice(0,1);

		//console.log("after, queue.length=%s, queue=%o", queue.length, queue);
		//console.log('t=%o', t);
		//console.log('t[0]=%o', t[0]);
		//console.log('t[1]=%o', t[1]);

		restoreLevel(t[0]);

		if (isLevelWinning(t[0]))
		{
			console.log("found winning state! solution=%o, iterations=%s", t[1], iteration);
			return [t[1], iteration];
		}

		//console.log("nope");
		var dirs = [0,1,2,3,4];
		var dir = -1;
		shuffle(dirs);
		for (var i=0; i<dirs.length; i++)
		{
			dir = dirs[i];
			restoreLevel(t[0]);
			processInput(dir, true, false);

			for (var j=0; j < silent_tick_count; j++) {
				processInput(-1,true,false);
			}

			u2 = t[1].slice(0);
			u2.push(dir);
			u = [backupLevel(), u2];

			if (!visited[u[0].concat(dir).toString()] && !isLevelEqual(u[0],t[0])) {
				visited[u[0].concat(dir).toString()] = true;
				queue.push(u);
			}
		}

		iteration++;

	}
	console.log("exhausted!");
	return [[],iteration];

}

function rebuild() {
	clearConsole();
	compile(["rebuild"]);
}

function restart() {
	clearConsole();
	compile(["restart"]);
}


function getTileXY(tileIndex) {

	var tileX = parseInt(tileIndex / level.height, 10);
	var tileY = parseInt(tileIndex % level.height, 10);
	//console.log('[get_index_manhattan_distance]:\t level=%s, level.height=%s tileIndex=%s, return=(%s,%s)', level, level.height, tileIndex, tileX, tileY);
	return [tileX,tileY];
}

function getTileIndex(tileX, tileY) {
	return tileX*level.height + tileY;
}

function get_index_manhattan_distance(index1, index2)
{
	//console.log('[get_index_manhattan_distance]:\t level=%s, index1=%s, index2=%s', level, index1, index2);
	var tileXY1 = getTileXY(index1);
	var tileXY2 = getTileXY(index2);

	return get_manhattan_distance(tileXY1[0], tileXY1[1], tileXY2[0], tileXY2[1]);
}

function get_manhattan_distance(x1, y1, x2, y2)
{
	//console.log('[get_manhattan_distance]:\t level=%s, x1=%s, y1=%s, x2=%s, y2=%s', level, x1, y2, x2, y2);
	return Math.abs(x2-x1) + Math.abs(y2-y1);
}

function get_level_score(leveldat) {
    var score = 0.0;
    var scores = [];

    if (state.winconditions.length>0)  {
        //var passed=true;
        for (var wcIndex=0;wcIndex<state.winconditions.length;wcIndex++) {
            var wincondition = state.winconditions[wcIndex];
            var filter1 = wincondition[1];
            var filter2 = wincondition[2];
            //var rulePassed=true;
            
            var indices1 = [];
            var indices2 = [];
            var criticalIndeces = [];
            var ruleIndeces = [];
            
            var winDistances = [];
            var distances = [];
            
            //Get the critical and rule objects
            var ruleAnalyzer = pslg.ruleAnalyzer;
            var criticalObjects = [];
            var ruleObjects = [];
            for (var i = 0; i < ruleAnalyzer.ruleObjects.length; i++){
                var obj = ruleAnalyzer.ruleObjects[i];
                if(ruleAnalyzer.winObjects.indexOf(obj) > -1 || obj === "player"){
                    continue;
                }
                var result = ruleAnalyzer.CheckCriticalObject(obj);
                switch(result){
                    case 0:
                        //useless object in rule
                        break;
                    case 1:
                        ruleObjects.push(state.objectMasks[obj]);
                        break;
                    case 2:
                        ruleObjects.push(state.objectMasks[obj]);
                        break;
                    case 3:
                        criticalObjects.push(state.objectMasks[obj]);
                        break;
                }
            }

            var conditionScore = 0.0;

            for (var i=0;i<leveldat.length;i++) {
                var val = leveldat[i];
                if ( (filter1&val)!==0 ) {
                        indices1.push(i);
                }
                if ( (filter2&val)!==0 ) {
                        indices2.push(i);
                }
                
                //critical objects indeces
                for (var j = 0; j < criticalObjects.length; j++) {
                    if((criticalObjects[j]&val) !== 0){
                        criticalIndeces.push(i);
                    }
                }
                
                //rule objects indeces
                for (var j = 0; j < ruleObjects.length; j++) {
                    if((ruleObjects[j]&val) !== 0){
                        ruleIndeces.push(i);
                    }
                }
            }

            for (var j=0; j<indices1.length;j++) {
                var dt = [];
                for (var k=0; k<indices2.length;k++) {
                        dt.push(get_index_manhattan_distance(indices1[j],indices2[k]));
                }
                if (dt.length > 0 ){
                        winDistances.push(dt.min());
                }

            }

            var playerPositions = getPlayerPositions();
            //var windices = indices1;	// ________ on something
            //var windices = indices2;	// something on _________ (LIMERICK)

            var windices = [];

            if ((filter1 & state.playerMask === 0) && (filter2 & state.playerMask === 0)) {
                windices = indices1.concat(indices2);
            }
            else {
                // winices are indices of objects that the player should go towards
                // if PLAYER is in FILTER1, then go for object2
                windices = filter1 & state.playerMask !== 0 ? indices2 : indices1;
            }

            for (var p=0; p < playerPositions.length; p++) {
                var dt2 = [];
                for (var o=0; o < windices.length; o++) {
                    dt2.push(get_index_manhattan_distance(playerPositions[p], windices[o]));
                }
                if (dt2.length > 0 ){
                    distances.push(dt2.avg());
                }
                
                //Critical Objects Distance
                dt2 = [];
                for (var o=0; o < criticalIndeces.length; o++) {
                    dt2.push(get_index_manhattan_distance(playerPositions[p], criticalIndeces[o]));
                }
                if (dt2.length > 0 ){
                    distances.push(0.5 * dt2.avg());
                }
                
                //Rule Objects Distance
                dt2 = [];
                for (var o=0; o < ruleIndeces.length; o++) {
                    dt2.push(get_index_manhattan_distance(playerPositions[p], ruleIndeces[o]));
                }
                if (dt2.length > 0 ){
                    distances.push(0.25 * dt2.avg());
                }
            }
            
            //console.log('[get_level_score]:\t wincondition=%s', wincondition[0]);
            //console.log('[get_level_score]:\t distances=%o', distances);
            var max_manhattan = level.width+level.height;
            switch(wincondition[0]) {
                case -1://NO
                {
                    if(winDistances.length <= 0){
                        winDistances.push(0);
                    }
                    conditionScore = 1 - winDistances.avg()/max_manhattan + distances.avg() / max_manhattan;
                    break;
                }
                case 0://SOME
                {
                    if(winDistances.length <= 0){
                        winDistances.push(max_manhattan);
                    }
                    conditionScore = winDistances.avg()/max_manhattan + distances.avg()/max_manhattan;
                    break;
                }
                case 1://ALL
                {
                    if(winDistances.length <= 0){
                        winDistances.push(max_manhattan);
                    }
                    conditionScore = winDistances.avg()/max_manhattan + distances.avg()/max_manhattan;
                    break;
                }
            }
            scores.push(conditionScore / 2);
        }
        score=scores.avg();
    }

    return score;
}

function get_output_score(leveldat) {
    var score = 0.0;
    var scores = [];

    if (state.winconditions.length>0)  {
        for (var wcIndex=0;wcIndex<state.winconditions.length;wcIndex++) {
            var wincondition = state.winconditions[wcIndex];
            var filter1 = wincondition[1];
            var filter2 = wincondition[2];

            var indices1 = [];
            var indices2 = [];
            var distances = [];

            var conditionScore = 0.0;

            for (var i=0;i<leveldat.length;i++) {
                var val = leveldat[i];
                if ( (filter1&val)!==0 ) {
                        indices1.push(i);
                }
                if ( (filter2&val)!==0 ) {
                        indices2.push(i);
                }
            }

            for (var j=0; j<indices1.length;j++) {
                var dt = [];
                for (var k=0; k<indices2.length;k++) {
                    dt.push(get_index_manhattan_distance(indices1[j],indices2[k]));
                }
                if (dt.length > 0 ){
                    distances.push(dt.min());
                }
            }
            
            var max_manhattan = level.width+level.height;
            switch(wincondition[0]) {
                case -1://NO
                {
                    if(distances.length <= 0){
                        distances.push(0);
                    }
                    conditionScore = 1 - distances.avg()/max_manhattan;
                    break;
                }
                case 0://SOME
                {
                    if(distances.length <= 0){
                        distances.push(max_manhattan);
                    }
                    conditionScore = distances.avg()/max_manhattan;
                    break;
                }
                case 1://ALL
                {
                    if(distances.length <= 0){
                        distances.push(max_manhattan);
                    }
                    conditionScore = distances.avg()/max_manhattan;
                    break;
                }
            }
            scores.push(conditionScore);
        }
        score=scores.avg();
    }

    return score;
}

function simulate_solution(solution, doMakeGIF) {
	var simulator_action = null;
	var keycode = null;

	for (var i=0; i<solution.length; i++) {
		simulator_action = solution[i];
	
		keycode = simulator_action_to_keycode(simulator_action);

		if (doMakeGIF) {
			processInput(keycode, true, false);
			inputHistory.push(simulator_action);
		}
		else {
			simulate_key_press(keycode);
		}
		for (var j=0; j < 10; j++) {
				processInput(-1,true,false);
		}
	}

	if (doMakeGIF) {
		makeGIF(false, true);
	}
}

function simulate_test1() {
	var solution = [SIMULATOR_MOVE_RIGHT, SIMULATOR_MOVE_RIGHT, SIMULATOR_MOVE_RIGHT];
	simulate_solution(solution);
}

function simulate_test2(doMakeGIF) {
	var solution = [2, 1, 0, 3, 3, 3, 2, 1, 0, 1, 1, 2, 2, 3, 0, 1, 0, 3, 0, 0, 1, 2, 3, 2, 2, 3, 3, 0, 1, 2, 1, 0];
	simulate_solution(solution, doMakeGIF);
}

function simulator_save_solution(solution, suffix) {
	if (!suffix || typeof(suffix) == "undefined") {
		suffix = "";
	}
	else {
		suffix  = "-" + suffix;
	}

	try {
		if (!!window.localStorage) {
			var key = state.metadata.title + "-" + curlevel + suffix;
			var old = localStorage.getItem(key);
			if (!old) {
				old = JSON.stringify([]);
			}
			var val = JSON.parse(old);

			if (val.length === 0) {
				console.log('val.length===0');
				val = [solution];
			}
			else if (val[1] && typeof(val[1])!="object") {
				console.log('old format');
				val = [val];
			}
			else {
				console.log('regular');
				val.push(solution);
			}
			console.log("val=%o", val);
			var str = JSON.stringify(val);

			console.log(">>>> Saving solution=%o, localStorage[%s]=%s", solution, key, str);
			localStorage.setItem(key, str);
		}
	} catch(ex) {
		console.warn(ex);
	}
}

function simulator_input_to_word(n) {
	switch(n) {
		case SIMULATOR_MOVE_RIGHT: return 'R';
		case SIMULATOR_MOVE_LEFT: return 'L';
		case SIMULATOR_MOVE_UP: return 'U';
		case SIMULATOR_MOVE_DOWN: return 'D';
		case SIMULATOR_ACTION: return 'A';
		default: return '?';
	}
	return '?';
}

function simulator_load_solution(suffix) {
	if (!suffix || typeof(suffix) == "undefined") {
		suffix = "";
	}
	try {
		if (!!window.localStorage) {
			var key = state.metadata.title + "-" + curlevel + suffix;
			var old = localStorage.getItem(key);
			if (!old) {
				old = JSON.stringify([]);
			}
			var val = JSON.parse(old);
			if (val.length === 0) {
				val = [];
			}
			else if (typeof(val[1])!="object") {
				val = [val];
			}

			console.log(">>>> Getting solution, localStorage[%s]=%o", key, val);
			return val;
			
		}
	} catch(ex) {
		console.warn(ex);
	}
}




// http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
