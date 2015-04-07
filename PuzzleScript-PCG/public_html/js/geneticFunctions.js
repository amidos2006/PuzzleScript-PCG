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
            solvedLevelScore.push(result);
            doNothingScore.push(doNothing(state.levels[i].dat));
            
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
    
    function ParameterEvolutionRandomValue(index){
        switch(index){
            case 0:
                return Number((Math.random() * 0.7 + 0.2).toPrecision(5));
            case 1:
                return 1;
            case 2:
                return Number((Math.random() * 0.25).toPrecision(5));
            case 3:
                return Number((Math.random()).toPrecision(5));
            case 4:
                return Number((Math.random() * 0.8).toPrecision(5));
            case 5:
                return Number((Math.random() * 0.3).toPrecision(5));
        }
        
        return Number((Math.random() * 0.1).toPrecision(5));
    }
    
    function ParameterEvolutionFixProbabilites(chromosome, lastProbability){
        var total = chromosome.genes[chromosome.genes.length - 1] + chromosome.genes[chromosome.genes.length - 2] + chromosome.genes[chromosome.genes.length - 3] + lastProbability;
        if (total === 0){
            total = 1;
        }
        chromosome.genes[chromosome.genes.length - 1] = Number((chromosome.genes[chromosome.genes.length - 1] / total).toPrecision(5));
        chromosome.genes[chromosome.genes.length - 2] = Number((chromosome.genes[chromosome.genes.length - 2] / total).toPrecision(5));
        chromosome.genes[chromosome.genes.length - 3] = Number((chromosome.genes[chromosome.genes.length - 3] / total).toPrecision(5));
    }
    
    function ParameterEvolutionInitialize(chromosome, initialData){
        chromosome.genes = [];
        chromosome.fitness = undefined;
        
        for (var i = 0; i < 6; i++) {
            chromosome.genes.push(ParameterEvolutionRandomValue(i));
        }
        
        ParameterEvolutionFixProbabilites(chromosome, ParameterEvolutionRandomValue(6));
    }
    
    function ParameterEvolutionClone(cloned, chromosome){
        cloned.genes = chromosome.genes.clone();
        cloned.fitness = chromosome.fitness;
        cloned.fitnessArray = chromosome.fitnessArray.clone();
        cloned.age = chromosome.age;
    }
    
    function ParameterEvolutionCrossOver(child1, child2, chromosome1, chromosome2){
        var pointOfSwap = Math.randomInt(chromosome1.genes.length - 1);
        
        for (var i = 0; i < chromosome1.genes.length; i++) {
            if(i <= pointOfSwap){
                child1.genes[i] = chromosome1.genes[i];
                child2.genes[i] = chromosome2.genes[i];
            }
            else{
                child1.genes[i] = chromosome2.genes[i];
                child2.genes[i] = chromosome1.genes[i];
            }
        }
        
        var lastProbability = 1 - chromosome1.genes[chromosome1.genes.length - 1] - chromosome1.genes[chromosome1.genes.length - 2] - chromosome1.genes[chromosome1.genes.length - 3];
        ParameterEvolutionFixProbabilites(child2, lastProbability);
        lastProbability = 1 - chromosome2.genes[chromosome2.genes.length - 1] - chromosome2.genes[chromosome2.genes.length - 2] - chromosome2.genes[chromosome2.genes.length - 3];
        ParameterEvolutionFixProbabilites(child1, lastProbability);
    }
    
    function ParameterEvolutionMutation(newChromosome, chromosome){
        newChromosome.genes = chromosome.genes.clone();
        var randomIndex = Math.randomInt(chromosome.genes.length);
        newChromosome.genes[randomIndex] = ParameterEvolutionRandomValue(randomIndex);
        
        var lastProbability = 1 - chromosome.genes[chromosome.genes.length - 1] - chromosome.genes[chromosome.genes.length - 2] - chromosome.genes[chromosome.genes.length - 3];
        ParameterEvolutionFixProbabilites(newChromosome, lastProbability);
    }
    
    function ParameterEvolutionCalculateFitness(chromosome){
        var state = pslg.state;
        var ruleAnalyzer = pslg.ruleAnalyzer;
        
        var levelGenerator = new pslg.LevelGenerator(new pslg.LGFeatures(chromosome.genes.clone()));
        var fitness = GetLevelFitness(levelGenerator.GenerateLevels(ruleAnalyzer, state));
        
        if(chromosome.fitnessArray === undefined){
            chromosome.fitnessArray = [];
        }
        chromosome.fitnessArray.push(fitness);
        chromosome.fitness = chromosome.fitnessArray.avg() + 
                (chromosome.age * 0.005) / pslg.GeneticAlgorithm.numberOfGenerations;
    }
    
    function LevelEvolutionRandomValue(lgFeature){
        var ruleAnalyzer = pslg.ruleAnalyzer;
        
        var criticalObjects = {};
        var ruleObjects = {};
        for (var i = 0; i < ruleAnalyzer.ruleObjects.length; i++){
            var obj = ruleAnalyzer.ruleObjects[i];
            var result = ruleAnalyzer.CheckCriticalObject(obj);
            switch(result){
                case 0:
                    //useless object in rule
                    break;
                case 1:
                    ruleObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
                    break;
                case 2:
                    ruleObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
                    break;
                case 3:
                    criticalObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
                    break;
            }
        }
        
        var criticalNumber = Object.keys(criticalObjects).length;
        var ruleNumber = Object.keys(ruleObjects).length;
        var solidNumber = ruleAnalyzer.solidObjects.length;
        var totalNumber = criticalNumber + ruleNumber + solidNumber;
        
        var criticalPropability = {};
        var objectAccumlator = 0;
        for (var obj in criticalObjects){
            objectAccumlator += ruleAnalyzer.objectPriority[obj];
            criticalPropability[obj] = objectAccumlator;
        }
        for (var obj in criticalPropability){
            criticalPropability[obj] /= objectAccumlator;
        }
        
        var rulePropability = {};
        objectAccumlator = 0;
        for(var obj in ruleObjects){
            objectAccumlator += ruleAnalyzer.objectPriority[obj];
            rulePropability[obj] = objectAccumlator;
        }
        for (var obj in rulePropability){
            rulePropability[obj] /= objectAccumlator;
        }
        
        var randomValue = Math.random();
            
        if(randomValue < criticalNumber / totalNumber){
            randomValue = Math.random();
            for (var obj in criticalPropability){
                if(randomValue < criticalPropability[obj]){
                    return obj;
                }
            }
        }
        else if(randomValue < (criticalNumber + ruleNumber) / totalNumber){
            randomValue = Math.random();
            for (var obj in rulePropability){
                if(randomValue < rulePropability[obj]){
                    return obj;
                }
            }
        }
        
        return ruleAnalyzer.solidObjects.rand();
    };
    
    function LevelEvolutionCalculateEmptyNonEmpty(chromosome){
        var state = pslg.state;
        var levelOutline = pslg.LevelGenerator.levelsOutline[chromosome.dl];
        for (var i = 0; i < chromosome.level.dat.length; i++) {
            if(levelOutline.dat[i] !== state.objectMasks["wall"] + state.objectMasks["background"]){
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
        
//        var coverSize = pslg.LevelGenerator.emptySpaces[chromosome.dl].length * chromosome.lgFeature.coverPercentage;
        newChromosome.level = deepCloneLevel(chromosome.level);
        newChromosome.notEmptySpaces = chromosome.notEmptySpaces.clone();
        newChromosome.emptySpaces = chromosome.emptySpaces.clone();
        
        var randomValue = Math.random();
//        var createProbability = (coverSize - this.notEmptySpaces.length) / coverSize;
//        var destroyProbability = (this.notEmptySpaces.length) / coverSize;
        if(randomValue < 0.2 && newChromosome.emptySpaces.length > 0){
            newChromosome.emptySpaces.shuffle();
            var randomObject = LevelEvolutionRandomValue(chromosome.lgFeature);
            var randomEmptySpace = newChromosome.emptySpaces[0];
            newChromosome.emptySpaces.splice(0, 1);
            newChromosome.notEmptySpaces.push(randomEmptySpace);
            
            newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomEmptySpace] | state.objectMasks[randomObject];
        }
        
        var randomValue = Math.random();
        if(randomValue < 0.2 && newChromosome.notEmptySpaces.length > 0){
            newChromosome.notEmptySpaces.shuffle();
            var randomNonEmptySpace = newChromosome.notEmptySpaces[0];
            newChromosome.notEmptySpaces.splice(0, 1);
            newChromosome.emptySpaces.push(randomNonEmptySpace);
            
            newChromosome.level.dat[randomNonEmptySpace] = state.objectMasks["background"];
        }
        
        var randomValue = Math.random();
        if(randomValue < 0.5 && newChromosome.notEmptySpaces.length > 0 && newChromosome.emptySpaces.length > 0){
            newChromosome.notEmptySpaces.shuffle();
            newChromosome.emptySpaces.shuffle();
            
            var randomNotEmptySpace = newChromosome.notEmptySpaces[0];
            var randomEmptySpace = newChromosome.emptySpaces[0];
            
            newChromosome.notEmptySpaces.splice(0, 1);
            newChromosome.emptySpaces.splice(0, 1);
            
            newChromosome.emptySpaces.push(randomNonEmptySpace);
            newChromosome.notEmptySpaces.push(randomEmptySpace);
            
            newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomNotEmptySpace];
            newChromosome.level.dat[randomNotEmptySpace] = state.objectMasks["background"];;
        }
    }
    
    function LevelEvolutionCalculateFitness(chromosome){
        if(this.fitness !== undefined){
            return;
        }
        
        chromosome.fitness = GetLevelFitness([chromosome.level]);
    }
    
    /////////////////////////////
    //  Variables Declaration
    /////////////////////////////
    pslg.state = undefined;
    pslg.ruleAnalyzer = undefined;
    pslg.maxIterations = 1000;
    pslg.totalDifficulties = 8;
    pslg.startingDifficulty = 0;
    
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
    
    pslg.LevelEvolutionInitialize = LevelEvolutionInitialize;
    pslg.LevelEvolutionClone = LevelEvolutionClone;
    pslg.LevelEvolutionCrossOver = LevelEvolutionCrossOver;
    pslg.LevelEvolutionMutation = LevelEvolutionMutation;
    pslg.LevelEvolutionCalculateFitness = LevelEvolutionCalculateFitness;
    
    pslg.ParameterEvolutionInitialize = ParameterEvolutionInitialize;
    pslg.ParameterEvolutionClone = ParameterEvolutionClone;
    pslg.ParameterEvolutionCrossOver = ParameterEvolutionCrossOver;
    pslg.ParameterEvolutionMutation = ParameterEvolutionMutation;
    pslg.ParameterEvolutionCalculateFitness = ParameterEvolutionCalculateFitness;
}());

