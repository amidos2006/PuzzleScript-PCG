/* 
 * Functions for Genetic Algorithms
 * Author: Ahmed Abdel Samea Khalifa
 * 
 * This file contains all the used fitness functions
 */

this.pslg = this.pslg||{};

(function()
{
    var differentCombinations = [];
    
    function InitializeSoultionAnalysis(actionList){
        differentCombinations = [];
        differentCombinations.push([]);
        differentCombinations[0].push([[], actionList.clone()]);
        for (var i = 0; i < 4; i++) {
            differentCombinations.push([]);
            for(var j = 0; j < differentCombinations[i].length; j++){
                var previousList = differentCombinations[i][j][0];
                var currentActionList = differentCombinations[i][j][1];
                for (var k = 0; k < currentActionList.length; k++) {
                    var newList = previousList.concat([currentActionList[k]]);
                    var newActionList = currentActionList.clone();
                    newActionList.splice(k, 1);
                    differentCombinations[i + 1].push([newList, newActionList]);
                }
            }
        }
    }
    
    function GetAverageSolutionLength(dl, totalDiffLevels){
        var maxValue = 0;
        var minValue = 0;
        for (var i = 0; i <= dl; i++) {
            var max = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 7, 2);
            var min = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 4, 1);
            maxValue += max;
            minValue += min;
        }
        
        return (maxValue + minValue) / 2;
    }
    
    function GetTrapeziumFunctionValue(x, hatPoint1, hatPoint2, maxValue, minValue){
        if(x > 0 && x < hatPoint1){
            return maxValue * x / hatPoint1 + minValue;
        }
        if(x > hatPoint2 && x < hatPoint1 + hatPoint2){
            return maxValue - maxValue * (x - hatPoint2) / hatPoint1 + minValue;
        }
        if(x >= hatPoint1 && x <= hatPoint2){
            return maxValue + minValue;
        }
        
        return minValue;
    }
    
    function SolutionDiffLengthScore(dl, diff, totalDiffLevels){
        var min = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 4, 1);
        var max = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 7, 2);
        
        var value = GetTrapeziumFunctionValue(Math.abs(diff), min, max, 1, 0);
        if(diff < 0){
            min = GetTrapeziumFunctionValue(dl, totalDiffLevels, totalDiffLevels, 2, 1);
            value = -GetTrapeziumFunctionValue(Math.abs(diff), min, 10000, 1, 0);
        }
        value = (value + 1) / 2;
        return value;
    }
    
    function SolutionLengthScore(length, width, height){
        return Math.getGaussianScore(length / ((width - 2) * (height - 2)), 1.3, 0.6);
    }
    
    function SolutionComplexityScore(solution, analysisDegree){
        if(solution.length === 0){
            return 0;
        }
        
        analysisDegree = Math.min(analysisDegree, 4);
        var analysisScore = [];
        for (var i = 1; i <= analysisDegree; i++) {
            var repeatingAmount = [];
            for (var k = 0; k < differentCombinations[i].length; k++) {
                repeatingAmount.push(0);
                var array1 = differentCombinations[i][k][0];
                for (var j = 0; j < solution.length - i; j++) {
                    var array2 = solution.slice(j, i);
                    if(array1.isEqual(array2)){
                        repeatingAmount[k] += 1;
                    }
                }
            }
            
            analysisScore.push(0);
            for (var j = 0; j < repeatingAmount.length; j++) {
                analysisScore[i - 1] += Math.abs(repeatingAmount[j] - solution.length / repeatingAmount.length);
            }
            analysisScore[i - 1] /= 2 * (repeatingAmount.length - 1) * solution.length / repeatingAmount.length;
        }
        
        return 1 - analysisScore.avg();
    }
    
    function BoxLineMetricScore(solution){
        if(solution.length < 1){
            return 0;
        }
        if(solution.length === 1){
            return 1;
        }
        
        var different = 0;
        for (var i = 1; i < solution.length; i++) {
            if(solution[i] !== solution[i - 1]){
                different += 1;
            }
        }
        
        return different / solution.length;
    }
    
    function ExplorationScore(win, iterations, maxIterations){
        if(win){
            return 0.75 + 0.25 * iterations / maxIterations;
        }
        
        if(iterations === maxIterations){
            return 0.5;
        }
        
        return 0;
    }
    
    function AppliedRulesScore(appRules, noMove, totalLength){
        if(totalLength === 0){
            return 0;
        }
        
        var value = appRules / totalLength;
        if(value > 0.4){
            value = (appRules + noMove) / totalLength;
        }
        else{
            value = (appRules - noMove) / totalLength;
        }
        return Math.getGaussianScore(value, 0.4, 0.15);
    }
    
    function NumberOfObjects(level){
        var state = pslg.state;
        var ruleAnalyzer = pslg.ruleAnalyzer;
        var totalObjects = Object.keys(ruleAnalyzer.minNumberObjects);
        var numOfObjects = {};
        
        for (var j = 0; j < level.length; j++) {
            for (var k = 0; k < totalObjects.length; k++) {
                var mask = state.objectMasks[totalObjects[k]];
                var result = level[j] & mask;
                if(result > 0){
                    if(numOfObjects[totalObjects[k]] === undefined){
                        numOfObjects[totalObjects[k]] = 1;
                    }
                    else{
                        numOfObjects[totalObjects[k]] += 1;
                    }
                }
            }
        }
        
        var currentObjects = 0;
        for (var i = 0; i < totalObjects.length; i++) {
            var obj = totalObjects[i];
            var number = 0;
            if(numOfObjects[obj] !== undefined){
                number = numOfObjects[obj];
            }
            if(number >= ruleAnalyzer.minNumberObjects[obj]){
                currentObjects += 1;
            }
        }
        
        var playerNumber = 0;
        if(numOfObjects["player"] === 1){
            playerNumber = 1;
        }
        
        var winObjects = 0;
        if(ruleAnalyzer.winRules[0] === "no"){
            if(numOfObjects[ruleAnalyzer.winObjects[0]] === numOfObjects[ruleAnalyzer.winObjects[1]]){
                winObjects = 1;
            }
        }
        else{
            var result = ruleAnalyzer.objectBehaviour[ruleAnalyzer.winObjects[0]] & pslg.ObjectBehaviour.CREATE |
                    ruleAnalyzer.objectBehaviour[ruleAnalyzer.winObjects[1]] & pslg.ObjectBehaviour.CREATE;
            if(result === 0){
                if(numOfObjects[ruleAnalyzer.winObjects[0]] === numOfObjects[ruleAnalyzer.winObjects[1]]){
                    winObjects = 1;
                }
            }
            else{
                winObjects = 1;
            }
        }
        
        return 0.4 * currentObjects / (totalObjects.length) + 0.3 * winObjects + 0.3 * playerNumber;
    }
    
    function GetLevelFitness(levels){
        var state = pslg.state;
        var maxIterations = pslg.maxIterations;
        
        state.levels = levels;

        var solutionLengthScore = [];
        var explorationScore = [];
        var boxMetricScore = [];
        var appliedRuleScore = [];
        var objectNumberScore = [];
        var doNothingScore = [];
        var solvedLevelScore = [];
        for(var i = 0; i < state.levels.length; i++){
            loadLevelFromState(state, i);
            var result = bestfs(state.levels[i].dat, maxIterations);
            if(pslg.doNothingWeight === 0){
                solvedLevelScore.push(Math.floor(result[0]));
                doNothingScore.push(Math.floor(doNothing(state.levels[i].dat)));
            }
            else{
                solvedLevelScore.push(result[0]);
                doNothingScore.push(doNothing(state.levels[i].dat));
            }
            levels[i].playable = solvedLevelScore[solvedLevelScore.length - 1] - 
                    doNothingScore[doNothingScore.length - 1];
            
            numAppRules = 0;
            loadLevelFromState(state, i);
            for (var j=0; j < 10; j++){
                processInput(-1,true,false);
            }
            
            solutionLengthScore.push(SolutionLengthScore(result[1].length, state.levels[i].w, state.levels[i].h));
            explorationScore.push(ExplorationScore(result[0] === 1, result[2], maxIterations));
            appliedRuleScore.push(AppliedRulesScore(result[3], numAppRules, result[1].length));
            boxMetricScore.push(BoxLineMetricScore(result[1]));
            objectNumberScore.push(NumberOfObjects(state.levels[i].dat));
        }
        
        var fitness = 0.3 * (solvedLevelScore.avg() - doNothingScore.avg()) +
                0.2 * solutionLengthScore.avg() +
                0.15 * objectNumberScore.avg() +
                0.12 * boxMetricScore.avg() +
                0.12 * appliedRuleScore.avg() +
                0.11 * explorationScore.avg();

        return fitness;
    }
    
    function ClearEditorRules(){
        var lineNumbers = pslg.state.winCondLineNumber;
        var minLine = lineNumbers - 1;
	var maxLine = lineNumbers - 1;
        editor.setCursor({line:minLine-1, ch:0});
	editor.setSelection({line:minLine, ch:0}, {line:maxLine, ch:999});
	editor.replaceSelection("");
        
        lineNumbers = pslg.state.ruleLineNumbers;
	minLine = lineNumbers.min()-1;
	maxLine = lineNumbers.max()-1;

	editor.setCursor({line:minLine-1, ch:0});
	editor.setSelection({line:minLine, ch:0}, {line:maxLine, ch:999});
	editor.replaceSelection("");   
    }
    
    function PrintObjects(objects){
        var string = "";
        for (var i = 0; i < objects.length; i++) {
            string += objects[i];
            if(i < objects.length - 1){
                string += " ";
            }
        }
        
        return string;
    }
    
    function PrintTuple(tuple){
        var string = "[ ";
        for (var i = 0; i < tuple.length; i++) {
            string += PrintObjects(tuple[i]);
            if(i < tuple.length - 1){
                string += " | ";
            }
        }
        string += " ]";
        return string;
    }
    
    function PrintHS(hs){
        var string = "";
        for (var i = 0; i < hs.length; i++) {
            string += PrintTuple(hs[i]);
        }
        
        return string;
    }
    
    function PrintRule(rule){
        return PrintHS(rule.lhs) + " -> " + PrintHS(rule.rhs);
    }
    
    function GetRuleFitness(rules, winningRule){
        //Initializing parameters
        console.log("\t\tClearing the editor");
        ClearEditorRules();
        var ruleLineStart = pslg.state.ruleLineNumbers.min();
	var lineIndex = ruleLineStart-1;
	var newLine = null;
        
        console.log("\t\tAdding new rules");
	for (var i=0; i < rules.length; i++) {
		lineIndex = ruleLineStart+i-1;
		newLine =  PrintRule(rules[i]);
		
		if (i < rules.length-1) {
			newLine += "\n";
		}
		editor.setLine(lineIndex, newLine);
	}
        
        console.log("\t\tAdding winning condition");
        var winCondLine = lineIndex + 6;
        newLine = winningRule[0] + " " + winningRule[1] + " on " + winningRule[2];
        editor.setLine(winCondLine, newLine);
	rebuild();
        
        console.log("\t\tRule Analyzing");
        pslg.state = state;
        pslg.ruleAnalyzer = new pslg.RuleAnalyzer();
        pslg.ruleAnalyzer.Initialize(pslg.state);
        
        console.log("\t\tRule Fitness");
        //Rule Fitness
        var player = 0;
        if(pslg.ruleAnalyzer.ruleObjects.indexOf("player") >= 0){
            player = 1;
        }
        var criticalPath = 0;
        if(pslg.ruleAnalyzer.CheckCriticalPath()){
            criticalPath = 1;
        }
        var uselessObjects = 1 / (pslg.ruleAnalyzer.GetUselessObjects().length + 1.0);
        var winningCondition = 0;
        if(pslg.ruleAnalyzer.CheckWinningValidity()){
            winningCondition = 1;
        }
        var winningObject = 0;
        if(pslg.ruleAnalyzer.ruleObjects.indexOf(pslg.ruleAnalyzer.winObjects[0]) >= 0 ||
                pslg.ruleAnalyzer.ruleObjects.indexOf(pslg.ruleAnalyzer.winObjects[1]) >= 0){
            winningObject = 1;
        }
        var playerLHS = 0;
        var playerObject = 0;
        var playerMovement = 0;
        var directionConst = [];
        var directions = [">", "<", "^", "v", "action"];
        var moveDirections = {};
        for (var rIndex = 0; rIndex < rules.length; rIndex++) {
            var tempRule = rules[rIndex];
            for (var dIndex = 0; dIndex < directions.length; dIndex++) {
                moveDirections[directions[dIndex]] = 0;
            }
            
            for (var tIndex = 0; tIndex < tempRule.lhs.length; tIndex++) {
                var tempTuple = tempRule.lhs[tIndex];
                for (var oIndex = 0; oIndex < tempTuple.length; oIndex++) {
                    var playerIndex = tempTuple[oIndex].indexOf("player");
                    if(playerIndex > 0){
                        playerLHS = 1;
                        if(tempTuple.length > 1){
                            playerObject = 1;
                        }
                        if(directions.indexOf(tempTuple[oIndex][playerIndex - 1]) > 0){
                            playerMovement = 1;
                        }
                    }
                    
                    for (var dIndex = 0; dIndex < directions.length; dIndex++) {
                        if(tempTuple[oIndex].indexOf(directions[dIndex]) >= 0){
                            moveDirections[directions[dIndex]] += 1;
                        }
                    }
                }
            }
            
            for (var tIndex = 0; tIndex < tempRule.rhs.length; tIndex++) {
                var tempTuple = tempRule.rhs[tIndex];
                for (var oIndex = 0; oIndex < tempTuple.length; oIndex++) {
                    var playerIndex = tempTuple[oIndex].indexOf("player");
                    if(playerIndex > 0){
                        playerMovement = 1;
                    }
                    for (var dIndex = 0; dIndex < directions.length; dIndex++) {
                        if(tempTuple[oIndex].indexOf(directions[dIndex]) >= 0){
                            moveDirections[directions[dIndex]] += 1;
                        }
                    }
                }
            }
            
            var unique = 0;
            for (var dIndex = 0; dIndex < directions.length; dIndex++) {
                if(moveDirections[directions[dIndex]] > 0){
                    unique += 1;
                }
            }
            if(unique === 0){
                directionConst.push(1);
            }
            else{
                directionConst.push(1 / unique);
            }
        }
        
        var heuristic = [player, criticalPath, uselessObjects, winningCondition, 
            winningObject, (playerLHS + playerObject) / 2, playerMovement, directionConst.avg()];
        
        //Level Fitness
        if(errorCount > 0){
            return 0.15 * heuristic.avg();
        }
        
        console.log("\t\tLevel Fitness");
        var levelGenerator = new pslg.LevelGenerator(pslg.LevelGenerator.AutoFeatures(pslg.ruleAnalyzer));
        var levels = [];
        for (var i = 0; i < pslg.ruleMaxGeneratedLevels; i++) {
            var level;
            if(pslg.ruleFixedLevel === 0){
                level = levelGenerator.GenerateLevel(pslg.ruleGeneratedLevelOutline, pslg.ruleAnalyzer, pslg.state);
            }
            else{
                level = deepCloneLevel(pslg.LevelGenerator.levelsOutline[0]);
            }
            level.fitness = pslg.GetLevelFitness([level], level);
            levels.push(level);
        }
        
        levels.sort(pslg.FitnessSort);
        var fitness = [];
        for (var i = 0; i < pslg.ruleNumberOfBestLevels; i++) {
            fitness.push(levels[i].playable);
        }
        
        var validity = errorCount > 0? 0 : 1;
        
        //Final value
        var ruleFitness = 0.3 * heuristic.avg() + 0.2 * validity;
        return 0.5 * fitness.avg() + 0.5 * ruleFitness;
    }
    
    function LevelEvolutionRandomValue(lgFeature){
        var ruleAnalyzer = pslg.ruleAnalyzer;
        return Object.keys(ruleAnalyzer.minNumberObjects).rand();
    };
    
    function LevelEvolutionCalculateEmptyNonEmpty(chromosome){
        var state = pslg.state;
        var levelOutline = pslg.LevelGenerator.levelsOutline[chromosome.dl];
        chromosome.emptySpaces = [];
        chromosome.notEmptySpaces = [];
        for (var i = 0; i < chromosome.level.dat.length; i++) {
            var result = levelOutline.dat[i] & state.objectMasks["wall"];
            if(result === 0){
                if(chromosome.level.dat[i] === state.objectMasks["background"]){
                    chromosome.emptySpaces.push(i);
                }
                else{
                    chromosome.notEmptySpaces.push(i);
                }
            }
        }
    }
    
    function LevelEvolutionInitialize(chromosome, initialData){
        var ruleAnalyzer = pslg.ruleAnalyzer;
        var state = pslg.state;
        
        chromosome.dl = initialData.dl;
        chromosome.lgFeature = initialData.lgFeature;
        chromosome.notEmptySpaces = [];
        chromosome.emptySpaces = [];
        chromosome.fitness = undefined;
        
        if(initialData.hasOwnProperty("emptyInitialize")){
            chromosome.level = deepCloneLevel(pslg.LevelGenerator.levelsOutline[chromosome.dl]);
        }
        else{
            var lg = new pslg.LevelGenerator(chromosome.lgFeature);
            chromosome.level = lg.GenerateLevel(chromosome.dl, ruleAnalyzer, state);
        }
        LevelEvolutionCalculateEmptyNonEmpty(chromosome);
    }
    
    function LevelEvolutionClone(cloned, chromosome){
        cloned.dl = chromosome.dl;
        cloned.lgFeature = chromosome.lgFeature;
        cloned.notEmptySpaces = chromosome.notEmptySpaces.clone();
        cloned.emptySpaces = cloned.emptySpaces.clone();
        cloned.fitness = chromosome.fitness;
        cloned.level = deepCloneLevel(chromosome.level);
    }
    
    function LevelEvolutionCrossOver(child1, child2, chromosome1, chromosome2){
        var swapPoint = Math.randomInt(chromosome1.level.dat.length - 2) + 1;
        for (var i = 0; i < chromosome1.level.dat.length; i++) {
            if(i <= swapPoint){
                child1.level.dat[i] = chromosome1.level.dat[i];
                child2.level.dat[i] = chromosome2.level.dat[i];
            }
            else
            {
                child1.level.dat[i] = chromosome2.level.dat[i];
                child2.level.dat[i] = chromosome1.level.dat[i];
            }
        }
        
        child1.notEmptySpaces = [];
        child1.emptySpaces = [];
        child2.notEmptySpaces = [];
        child2.emptySpaces = [];
        
        LevelEvolutionCalculateEmptyNonEmpty(child1);
        LevelEvolutionCalculateEmptyNonEmpty(child2);
    }
    
    function LevelEvolutionMutation(newChromosome, chromosome){
        var state = pslg.state;
        var ruleAnalyzer = pslg.ruleAnalyzer;
        
        newChromosome.level = deepCloneLevel(chromosome.level);
        newChromosome.notEmptySpaces = chromosome.notEmptySpaces.clone();
        newChromosome.emptySpaces = chromosome.emptySpaces.clone();
        
        var randomObject, randomEmptySpace, randomNonEmptySpace;
        
        var randomValue = Math.random();
        if(randomValue < 0.2 && newChromosome.emptySpaces.length > 0){
            newChromosome.emptySpaces.shuffle();
            randomObject = LevelEvolutionRandomValue(chromosome.lgFeature);
            var objectValue = state.objectMasks[randomObject];
            if(ruleAnalyzer.winRules[0] === "no" && ruleAnalyzer.winObjects.indexOf(randomObject) >= 0){
                objectValue = state.objectMasks[ruleAnalyzer.winObjects[0]] | state.objectMasks[ruleAnalyzer.winObjects[1]];
            }
            randomEmptySpace = newChromosome.emptySpaces[0];
            newChromosome.emptySpaces.splice(0, 1);
            newChromosome.notEmptySpaces.push(randomEmptySpace);
            
            newChromosome.level.dat[randomEmptySpace] = state.objectMasks["background"] | objectValue;
        }
        
        var randomValue = Math.random();
        if(randomValue < 0.2 && newChromosome.notEmptySpaces.length > 0){
            newChromosome.notEmptySpaces.shuffle();
            randomNonEmptySpace = newChromosome.notEmptySpaces[0];
            newChromosome.notEmptySpaces.splice(0, 1);
            newChromosome.emptySpaces.push(randomNonEmptySpace);
            
            newChromosome.level.dat[randomNonEmptySpace] = state.objectMasks["background"];
        }
        
        var randomValue = Math.random();
        if(randomValue < 0.5 && newChromosome.notEmptySpaces.length > 0 && newChromosome.emptySpaces.length > 0){
            newChromosome.notEmptySpaces.shuffle();
            newChromosome.emptySpaces.shuffle();
            
            randomNonEmptySpace = newChromosome.notEmptySpaces[0];
            randomEmptySpace = newChromosome.emptySpaces[0];
            
            newChromosome.notEmptySpaces.splice(0, 1);
            newChromosome.emptySpaces.splice(0, 1);
            
            newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomNonEmptySpace];
            newChromosome.level.dat[randomNonEmptySpace] = state.objectMasks["background"];
            
            newChromosome.emptySpaces.push(randomNonEmptySpace);
            newChromosome.notEmptySpaces.push(randomEmptySpace);
        }
    }
    
    function LevelEvolutionCalculateFitness(chromosome){
        if(chromosome.fitness !== undefined){
            return;
        }
        
        chromosome.fitness = GetLevelFitness([chromosome.level]);
    }
    
    function GetPossibleObjects(){
        var objects = Object.keys(pslg.state.objects);
        for (var i = 0; i < objects.length; i++) {
            if(objects[i] === "background"){
                objects.splice(i, 1);
            }
        }
        return objects;
    }
    
    function CreateEmptyRule(){
        return {
            lhs: deepCloneHS(pslg.emptyRule.lhs),
            rhs: deepCloneHS(pslg.emptyRule.rhs)
        };
    }
    
    function CreateRandomWinCond(){
        var differentRules = ["all", "some", "no"];
        var objects = GetPossibleObjects();
        var index1 = Math.randomInt(objects.length);
        var index2 = (index1 + Math.randomInt(objects.length - 1) + 1) % objects.length;
        
        return [differentRules.rand(), objects[index1], objects[index2]];
    }
    
    function RuleEvolutionInitialize(chromosome, initialData){
        pslg.emptyRule = initialData.emptyRule;
        pslg.rules = initialData.rules;
        pslg.winRule = initialData.winRule;
        if(pslg.ruleFixedRules === 0){
            chromosome.rules = [CreateEmptyRule()];
        }
        else{
            chromosome.rules = initialData.rules;
        }
        if(pslg.ruleFixedWinRule === 0){
            chromosome.winRule = CreateRandomWinCond();
        }
        else{
            chromosome.winRule = pslg.winRule;
        }
        chromosome.fitness = undefined;
        
        for (var i = 0; i < 25; i++) {
            RuleEvolutionMutation(chromosome, chromosome);
        }
    }
    
    function RuleEvolutionClone(cloned, chromosome){
        var rules = [];
        for (var i = 0; i < chromosome.rules.length; i++) {
            rules.push({
                lhs: deepCloneHS(chromosome.rules[i].lhs),
                rhs: deepCloneHS(chromosome.rules[i].rhs)
            });
        }
        cloned.rules = rules;
        cloned.winRule = chromosome.winRule.clone();
        cloned.fitness = chromosome.fitness;
    }
    
    function RuleEvolutionCrossOver(child1, child2, chromosome1, chromosome2){
        var random = Math.random();
        if(pslg.ruleFixedRules === 0){
            if(random < 0.5){
                //Swap RHS with LHS
                child1.rules = [];
                child2.rules = [];
                for (var i = 0; i < chromosome1.rules.length; i++) {
                    var rule1 = chromosome1.rules[i];
                    var rule2 = chromosome2.rules[i];
                    child1.rules.push({
                        lhs: deepCloneHS(rule1.lhs),
                        rhs: deepCloneHS(rule2.rhs)
                    });
                    child2.rules.push({
                        lhs: deepCloneHS(rule2.lhs),
                        rhs: deepCloneHS(rule1.rhs)
                    });
                }
            }
            else{
                //Swap Object
                RuleEvolutionClone(child1, chromosome1);
                RuleEvolutionClone(child2, chromosome2);
                for (var i = 0; i < child1.rules.length; i++) {
                    var hs = Math.random() < 0.5? "lhs" : "rhs";
                    var randomTuple = Math.randomInt(child1.rules[i][hs].length);
                    var tuple1 = child1.rules[i][hs][randomTuple];
                    var tuple2 = child2.rules[i][hs][randomTuple];
                    var swapedObject = Math.randomInt(tuple1.length);
                    var temp = tuple1[swapedObject];
                    tuple1[swapedObject] = tuple2[swapedObject];
                    tuple2[swapedObject] = temp;
                }
            }
        }
        
        //WinRule Crossover
        if(pslg.ruleFixedWinRule === 0){
            var swapObject = Math.randomInt(chromosome1.winRule.length);
            child1.winRule = chromosome1.winRule.clone();
            child2.winRule = chromosome2.winRule.clone();
            child1.winRule[swapObject] = chromosome2.winRule[swapObject];
            child2.winRule[swapObject] = chromosome1.winRule[swapObject];
        }
        child1.fitness = undefined;
        child2.fitness = undefined;
    }
    
    function RuleSizeMutator(chromosome){
        var random = Math.random();
        if(random < 0.5){
            if(chromosome.rules.length < 4){
                chromosome.rules.push(CreateEmptyRule());
            }
        }
        else{
            if(chromosome.rules.length > 1){
                var randomIndex = Math.randomInt(chromosome.rules.length);
                chromosome.rules.splice(randomIndex, 1);
            }
        }
    }
    
    function ObjectMutator(chromosome){
        var randomRule = Math.randomInt(chromosome.rules.length);
        var randomHS = ["lhs", "rhs"].rand();
        var randomTuple = Math.randomInt(chromosome.rules[randomRule][randomHS].length);
        if(chromosome.rules[randomRule][randomHS][randomTuple].length > 0){
            var randomObject = Math.randomInt(chromosome.rules[randomRule][randomHS][randomTuple].length);
            if(chromosome.rules[randomRule][randomHS][randomTuple][randomObject].length > 0){
                var objects = GetPossibleObjects();
                objects.push("");
                chromosome.rules[randomRule][randomHS][randomTuple][randomObject][1] = objects.rand();
                if(chromosome.rules[randomRule][randomHS][randomTuple][randomObject][1] === ""){
                    chromosome.rules[randomRule][randomHS][randomTuple][randomObject] = [];
                }
            }
        }
    }
    
    function DirectionMutator(chromosome){
        var randomRule = Math.randomInt(chromosome.rules.length);
        var randomHS = ["lhs", "rhs"].rand();
        var randomTuple = Math.randomInt(chromosome.rules[randomRule][randomHS].length);
        if(chromosome.rules[randomRule][randomHS][randomTuple].length > 0){
            var randomObject = Math.randomInt(chromosome.rules[randomRule][randomHS][randomTuple].length);
            if(chromosome.rules[randomRule][randomHS][randomTuple][randomObject].length > 0){
                var directions = ["<", ">", "^", "v", "action", "", "", "", "", ""];
                chromosome.rules[randomRule][randomHS][randomTuple][randomObject][0] = directions.rand();
            }
        }
    }
    
    function TupleSizeMutator(chromosome){
        var randomRule = Math.randomInt(chromosome.rules.length);
        var randomTuple = Math.randomInt(chromosome.rules[randomRule]["lhs"].length);
        var random = Math.random();
        if(random < 0.5){
            var objects = GetPossibleObjects();
            var directions = ["<", ">", "^", "v", "action", "", "", "", "", ""];
            
            if(chromosome.rules[randomRule]["lhs"][randomTuple].length < 3){
                var randomObject = Math.randomInt(chromosome.rules[randomRule]["lhs"][randomTuple].length + 1);
                chromosome.rules[randomRule]["lhs"][randomTuple].splice(randomObject, 0, [directions.rand(), objects.rand()]);
                randomObject = Math.randomInt(chromosome.rules[randomRule]["lhs"][randomTuple].length + 1);
                chromosome.rules[randomRule]["rhs"][randomTuple].splice(randomObject, 0, [directions.rand(), objects.rand()]);
            }
        }else{
            if(chromosome.rules[randomRule]["lhs"][randomTuple].length > 1){
                var randomObject = Math.randomInt(chromosome.rules[randomRule]["lhs"][randomTuple].length);
                chromosome.rules[randomRule]["lhs"][randomTuple].splice(randomObject, 1);
                randomObject = Math.randomInt(chromosome.rules[randomRule]["lhs"][randomTuple].length);
                chromosome.rules[randomRule]["rhs"][randomTuple].splice(randomObject, 1);
            }
        }
    }
    
    function HandSideSwapMutator(chromosome){
        var randomRule = Math.randomInt(chromosome.rules.length);
        var tempHS = chromosome.rules[randomRule].lhs;
        chromosome.rules[randomRule].lhs = chromosome.rules[randomRule].rhs;
        chromosome.rules[randomRule].rhs = tempHS;
    }
    
    function WinRuleMutator(chromosome){
        var randomIndex = Math.randomInt(chromosome.winRule.length);
        if(randomIndex === 0){
            var rules = ["all", "some", "no"];
            chromosome.winRule[0] = rules.rand();
        }
        else{
            var objects = GetPossibleObjects();
            chromosome.winRule[randomIndex] = objects.rand();
        }
    }
    
    function RuleEvolutionMutation(newChromosome, chromosome){
        RuleEvolutionClone(newChromosome, chromosome);
        var mutators = [];
        if(pslg.ruleFixedRules === 0){
            mutators.push(RuleSizeMutator);
            mutators.push(ObjectMutator);
            mutators.push(DirectionMutator);
            mutators.push(TupleSizeMutator);
            mutators.push(HandSideSwapMutator);
        }
        if(pslg.ruleFixedWinRule === 0){
            mutators.push(WinRuleMutator);
        }
        
        for (var i = 0; i < mutators.length; i++) {
            var random = Math.random();
            if(random < 0.2){
                mutators[i](newChromosome);
            }
        }
        
        newChromosome.fitness = undefined;
    }
    
    function RuleEvolutionCalculateFitness(chromosome){
        if(chromosome.fitness !== undefined){
            console.log("\t\tOld Chromosome");
            return;
        }
        
        chromosome.fitness = GetRuleFitness(chromosome.rules, chromosome.winRule);
    }
    
    function RuleEvolutionEqual(chromosome1, chromosome2){
        if(chromosome1.rules.length !== chromosome2.rules.length){
            return false;
        }
        
        for (var i = 0; i < chromosome1.rules.length; i++) {
            var rule1 = chromosome1.rules[i];
            var rule2 = chromosome2.rules[i];
            if(rule1.lhs.length !== rule2.lhs.length){
                return false;
            }
            
            for (var j = 0; j < rule1.lhs.length; j++) {
                if(rule1.lhs[j].length !== rule2.lhs[j].length){
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /////////////////////////////
    //  Variables Declaration
    /////////////////////////////
    pslg.state = undefined;
    pslg.ruleAnalyzer = undefined;
    pslg.maxIterations = 1000;
    pslg.totalDifficulties = 8;
    pslg.startingDifficulty = 0;
    pslg.ruleMaxGeneratedLevels = 20;
    pslg.ruleNumberOfBestLevels = 10;
    pslg.ruleGeneratedLevelOutline = 2;
    pslg.doNothingWeight = 1;
    pslg.ruleFixedLevel = 0;
    pslg.ruleFixedWinRule = 0;
    pslg.ruleFixedRules = 0;
    
    /////////////////////////////
    //  Functions Declaration
    /////////////////////////////
    pslg.InitializeSoultionAnalysis = InitializeSoultionAnalysis;
    pslg.GetAverageSolutionLength = GetAverageSolutionLength;
    pslg.GetTrapeziumFunctionValue = GetTrapeziumFunctionValue;
    pslg.SolutionDiffLengthScore = SolutionDiffLengthScore;
    pslg.SolutionLengthScore = SolutionLengthScore;
    pslg.SolutionComplexityScore = SolutionComplexityScore;
    pslg.BoxLineMetricScore = BoxLineMetricScore;
    pslg.ExplorationScore = ExplorationScore;
    pslg.AppliedRulesScore = AppliedRulesScore;
    pslg.NumberOfObjects = NumberOfObjects;
    pslg.GetLevelFitness = GetLevelFitness;
    pslg.GetRuleFitness = GetRuleFitness;
    pslg.PrintRule = PrintRule;
    
    pslg.LevelEvolutionInitialize = LevelEvolutionInitialize;
    pslg.LevelEvolutionClone = LevelEvolutionClone;
    pslg.LevelEvolutionCrossOver = LevelEvolutionCrossOver;
    pslg.LevelEvolutionMutation = LevelEvolutionMutation;
    pslg.LevelEvolutionCalculateFitness = LevelEvolutionCalculateFitness;
    
    pslg.RuleEvolutionInitialize = RuleEvolutionInitialize;
    pslg.RuleEvolutionClone = RuleEvolutionClone;
    pslg.RuleEvolutionCrossOver = RuleEvolutionCrossOver;
    pslg.RuleEvolutionMutation = RuleEvolutionMutation;
    pslg.RuleEvolutionCalculateFitness = RuleEvolutionCalculateFitness;
    pslg.RuleEvolutionEqual = RuleEvolutionEqual;
}());

