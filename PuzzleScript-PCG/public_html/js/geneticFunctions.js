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
        var value = 0;
        for (var i = 0; i <= dl; i++) {
            var max = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 7, 2);
            value += max;
        }
        
        return value;
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
    
    function RandomSolverScore(win, dl, length){
        if(win){
            if(length > 0){
                return -Math.min(1, (dl + 1) / length);
            }
            return -1;
        }
        return 0;
    }
    
    function SolutionLengthScore(dl, diff, totalDiffLevels){
        var min = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 4, 1);
        var max = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 7, 2);
        
        var value = GetTrapeziumFunctionValue(Math.abs(diff), min, max, 1, 0);
        if(diff < 0){
            min = GetTrapeziumFunctionValue(dl, totalDiffLevels, totalDiffLevels, 2, 1);
            value = -GetTrapeziumFunctionValue(Math.abs(diff), min, 10000, 1, 0);
        }
        
        return value;
    }
    
    function SolvedLevelsScore(numberOfSolved, totalDiffLevels){
        return numberOfSolved / totalDiffLevels;
    }
    
    function SolutionComplexityScore(solution, analysisDegree){
        if(differentCombinations.length === 0){
            differentCombinations = pslg.differentCombinations;
        }
        
        if(solution.length === 0){
            return -1;
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
        
        return -analysisScore.avg();
    }
    
    function ExplorationScore(win, iterations, maxIterations){
        if(win){
            return 1;
        }
        return iterations / maxIterations;
    }
    
    function ParameterEvolutionRandomValue(index, pregene){
        switch(index){
            case 0:
                return Number((Math.random() * 0.6 + 0.2).toPrecision(5));
            case 1:
                return Math.randomInt(4);
            case 2:
                return Number((Math.random() * 0.75 + 0.25).toPrecision(5));
            case 3:
                return Number((Math.random() * 0.5).toPrecision(5));
            case 4:
                return Number((Math.random() * 0.5 + 0.2).toPrecision(5));
        }
        return Number((Math.random() * (1 - pregene)).toPrecision(5));
    }
    
    function ParameterEvolutionFixProbabilites(chromosome, thirdProbability){
        var total = chromosome.genes[chromosome.genes.length - 1] + chromosome.genes[chromosome.genes.length - 2] + thirdProbability;
        if (total === 0){
            total = 1;
        }
        chromosome.genes[chromosome.genes.length - 1] /= total;
        chromosome.genes[chromosome.genes.length - 2] /= total;
    }
    
    function ParameterEvolutionInitialize(chromosome, initialData){
        chromosome.genes = [];
        chromosome.fitness = undefined;
        
        chromosome.genes.push(ParameterEvolutionRandomValue(i, 0));
        for (var i = 1; i < 6; i++) {
            chromosome.genes.push(ParameterEvolutionRandomValue(i, chromosome.genes[i - 1]));
        }
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
        
        var thirdProbability = 1 - chromosome1.genes[chromosome1.genes.length - 1] - chromosome1.genes[chromosome1.genes.length - 2];
        ParameterEvolutionFixProbabilites(child2, thirdProbability);
        thirdProbability = 1 - chromosome2.genes[chromosome2.genes.length - 1] - chromosome2.genes[chromosome2.genes.length - 2];
        ParameterEvolutionFixProbabilites(child1, thirdProbability);
    }
    
    function ParameterEvolutionMutation(newChromosome, chromosome){
        newChromosome.genes = chromosome.genes.clone();
        var randomIndex = Math.randomInt(chromosome.genes.length);
        if(randomIndex > 0){
            newChromosome.genes[randomIndex] = ParameterEvolutionRandomValue(randomIndex, newChromosome.genes[randomIndex - 1]);
        }
        else{
            newChromosome.genes[randomIndex] = ParameterEvolutionRandomValue(randomIndex, 0);
        }
        
        var thirdProbability = 1 - chromosome.genes[chromosome.genes.length - 1] - chromosome.genes[chromosome.genes.length - 2];
        ParameterEvolutionFixProbabilites(newChromosome, thirdProbability);
    }
    
    function ParameterEvolutionCalculateFitness(chromosome){
        var state = pslg.state;
        var ruleAnalyzer = pslg.ruleAnalyzer;
        var totalDifficulties = pslg.totalDifficulties;
        var maxIterations = pslg.maxIterations;
        
        var levelGenerator = new pslg.LevelGenerator(new pslg.LGFeatures(chromosome.genes.clone()));
        state.levels = levelGenerator.GenerateLevels(ruleAnalyzer, state);
        
        var randomFitness = [];
        var solutionLengthScore = [];
        var solutionComplexityScore = [];
        var explorationScore = [];
        var previousSolutionLength = 0;
        var solvedLevelScore = 0;
        for(var i = 0; i < state.levels.length; i++){
            var dl = Math.floor(i / pslg.LevelGenerator.numberOfLevelsPerDifficulty);
            loadLevelFromState(state, i);
            console.log("\t\tSolving level " + (i + 1).toString());
            var result = bestfs(state.levels[i].dat, maxIterations);
            loadLevelFromState(state, i);
            var randomResult = randomSolver(state.levels[i].dat, maxIterations);
            solvedLevelScore += result[0];
            
            randomFitness.push(RandomSolverScore(randomResult[0] === 1, dl, randomResult[1].length));
            solutionLengthScore.push(SolutionLengthScore(dl, result[1].length - previousSolutionLength, totalDifficulties));
            solutionComplexityScore.push(SolutionComplexityScore(result[1], 3));
            explorationScore.push(ExplorationScore(result[0] === 1, result[2], maxIterations));
            
            previousSolutionLength = result[1].length;
        }
        
        solvedLevelScore = SolvedLevelsScore(solvedLevelScore, totalDifficulties);
        
        chromosome.fitness = solvedLevelScore + randomFitness.avg() + solutionLengthScore.avg() + solutionComplexityScore.avg() + explorationScore.avg() + 2;
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
        
        var criticalNumber = Object.keys(criticalObjects).length * lgFeature.criticalWeight;
        var ruleNumber = Object.keys(ruleObjects).length * lgFeature.ruleWeight;
        var solidNumber = ruleAnalyzer.solidObjects.length * (1 - lgFeature.criticalWeight - lgFeature.ruleWeight);
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
    
    function LevelEvolutionInitialize(chromosome, initialData){
        var ruleAnalyzer = pslg.ruleAnalyzer;
        var state = pslg.state;
        
        chromosome.dl = initialData.dl;
        chromosome.lgFeature = initialData.lgFeature;
        chromosome.notEmptySpaces = [];
        chromosome.emptySpaces = [];
        chromosome.fitness = undefined;
        
        var lg = new pslg.LevelGenerator(chromosome.lgFeature);
        chromosome.level = lg.GenerateLevel(chromosome.dl, ruleAnalyzer, state);
        for (var i = 0; i < chromosome.level.dat.length; i++) {
            if(chromosome.level.dat[i] === state.objectMasks["background"]){
                chromosome.emptySpaces.push(i);
            }
            else if(chromosome.level.dat[i] !== state.objectMasks["wall"] + state.objectMasks["background"]){
                chromosome.notEmptySpaces.push(i);
            }
        }
    }
    
    function LevelEvolutionCrossOver(child1, child2, chromosome1, chromosome2){
        var state = pslg.state;
        
        var swapPoint = Math.randomInt(chromosome1.level.dat.length - 1);
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
        for (var i = 0; i < child1.level.dat.length; i++) {
            if(child1.level.dat[i] === state.objectMasks["background"]){
                child1.emptySpaces.push(i);
            }
            else if(child1.level.dat[i] !== state.objectMasks["wall"]){
                child1.notEmptySpaces.push(i);
            }
            
            if(child2.level.dat[i] === state.objectMasks["background"]){
                child2.emptySpaces.push(i);
            }
            else if(child2.level.dat[i] !== state.objectMasks["wall"]){
                child2.notEmptySpaces.push(i);
            }
        }
    }
    
    function LevelEvolutionMutation(newChromosome, chromosome){
        var state = pslg.state;
        
        var coverSize = pslg.LevelGenerator.emptySpaces[chromosome.dl].length * chromosome.lgFeature.coverPercentage;
        newChromosome.level = deepCloneLevel(chromosome.level);
        newChromosome.notEmptySpaces = chromosome.notEmptySpaces.clone();
        newChromosome.emptySpaces = chromosome.emptySpaces.clone();
        
        var randomValue = Math.random();
        var createProbability = (coverSize - this.notEmptySpaces.length) / coverSize;
        var destroyProbability = (this.notEmptySpaces.length) / coverSize;
        if(randomValue < createProbability * 0.7){
            newChromosome.emptySpaces.shuffle();
            var randomObject = LevelEvolutionRandomValue(chromosome.lgFeature);
            var randomEmptySpace = newChromosome.emptySpaces[0];
            newChromosome.emptySpaces.splice(0, 1);
            newChromosome.notEmptySpaces.push(randomEmptySpace);
            
            newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomEmptySpace] | state.objectMasks[randomObject];
        }
        else if(randomValue < destroyProbability * 0.7){
            newChromosome.notEmptySpaces.shuffle();
            var randomNonEmptySpace = newChromosome.notEmptySpaces[0];
            newChromosome.notEmptySpaces.splice(0, 1);
            newChromosome.emptySpaces.push(randomNonEmptySpace);
            
            newChromosome.level.dat[randomNonEmptySpace] = state.objectMasks["background"];
        }
        else{
            newChromosome.notEmptySpaces.shuffle();
            newChromosome.emptySpaces.shuffle();
            
            var randomNotEmptySpace = newChromosome.notEmptySpaces[0];
            var randomEmptySpace = newChromosome.emptySpaces[1];
            
            newChromosome.notEmptySpaces.splice(0, 1);
            newChromosome.emptySpaces.splice(0, 1);
            
            newChromosome.emptySpaces.push(randomNonEmptySpace);
            newChromosome.notEmptySpaces.push(randomEmptySpace);
            
            newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomNotEmptySpace];
            newChromosome.level.dat[randomNotEmptySpace] = state.objectMasks["background"];;
        }
    }
    
    function LevelEvolutionCalculateFitness(chromosome){
        var state = pslg.state;
        var totalDifficulties = pslg.totalDifficulties;
        var maxIterations = pslg.maxIterations;
        
        if(this.fitness !== undefined){
            return;
        }
        
        state.levels = [chromosome.level];
        var previousSolutionLength = GetAverageSolutionLength(chromosome.dl, totalDifficulties);
        
        loadLevelFromState(state, 0);
        console.log("\t\tSolving level with difficulty" + (chromosome.dl + 1).toString());
        var result = bestfs(state.levels[0].dat, maxIterations);
        loadLevelFromState(state, 0);
        var randomResult = randomSolver(state.levels[0].dat, maxIterations);

        var randomFitness = RandomSolverScore(randomResult[0] === 1, chromosome.dl, randomResult[1].length);
        var solutionLengthScore = SolutionLengthScore(chromosome.dl, result[1].length - previousSolutionLength, totalDifficulties);
        var solutionComplexityScore = SolutionComplexityScore(result[1], 3);
        var explorationScore = ExplorationScore(result[0] === 1, result[2], maxIterations);
        
        chromosome.fitness = result[0] + randomFitness + solutionLengthScore + solutionComplexityScore + explorationScore + 2;
    }
    
    function ParallelLevelEvolutionFinishFunction(bestSolutions){
        disableIO = false;
        
        pslg.state.levels = [bestSolutions[0].level];
        loadLevelFromState(pslg.state, 0);
    }
    
    function ParallelLevelEvolutionFitness(chromosomes, nextPopulation){
        var parallel = new Parallel(chromosomes, { env: {state: pslg.state, ruleAnalyzer: pslg.ruleAnalyzer, 
            differentCombinations: differentCombinations, Fitness: pslg.LevelEvolutionCalculateFitness}, 
            evalPath: 'js/eval.js'});
        parallel.require('geneticFunctions.js', 'globalVariables.js', 'engine.js', 'simulator.js', 'helper.js')
            .map(function(chromosome){
                    pslg.state = global.env.state;
                    pslg.ruleAnalyzer = global.env.ruleAnalyzer;
                    pslg.differentCombinations = global.env.differentCombinations;
                    state = global.env.state;
                    disableIO = true;
                    pslg.LevelEvolutionCalculateFitness(chromosome);
                    console.log("\tChromosome number: " + (chromosome.id + 1).toString() + " Fitness Score: " + chromosome.fitness.toString());
                    return chromosome;
            }).then(nextPopulation);
    }
    
    /////////////////////////////
    //  Variables Declaration
    /////////////////////////////
    pslg.state = undefined;
    pslg.ruleAnalyzer = undefined;
    pslg.maxIterations = 1000;
    pslg.totalDifficulties = 8;
    
    /////////////////////////////
    //  Functions Declaration
    /////////////////////////////
    pslg.InitializeSoultionAnalysis = InitializeSoultionAnalysis;
    
    pslg.LevelEvolutionInitialize = LevelEvolutionInitialize;
    pslg.LevelEvolutionCrossOver = LevelEvolutionCrossOver;
    pslg.LevelEvolutionMutation = LevelEvolutionMutation;
    pslg.LevelEvolutionCalculateFitness = LevelEvolutionCalculateFitness;
    
    pslg.ParallelLevelEvolutionFinishFunction = ParallelLevelEvolutionFinishFunction;
    pslg.ParallelLevelEvolutionFitness = ParallelLevelEvolutionFitness;
    
    pslg.ParameterEvolutionInitialize = ParameterEvolutionInitialize;
    pslg.ParameterEvolutionCrossOver = ParameterEvolutionCrossOver;
    pslg.ParameterEvolutionMutation = ParameterEvolutionMutation;
    pslg.ParameterEvolutionCalculateFitness = ParameterEvolutionCalculateFitness;
}());
