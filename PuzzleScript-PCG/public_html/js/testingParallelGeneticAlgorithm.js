/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function FitnessSort(a, b) {
    if (a.fitness > b.fitness) {
            return -1;
    }
    else if (a.fitness < b.fitness) {
            return 1;
    }
    else {
            return 0;
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

function ParallelLGEvolutionChromosomeRandomValue(ruleAnalyzer, lgFeature){
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

function ParallelLGEvolutionChromosomeInitialize(chromosome, intialData){
    chromosome.dl = intialData.dl;
    chromosome.lgFeature = intialData.lgFeature;
    var lg = new pslg.LevelGenerator(chromosome.lgFeature);
    chromosome.level = lg.GenerateLevel(chromosome.dl, pslg.ruleAnalyzer, pslg.state);
    chromosome.notEmptySpaces = [];
    chromosome.emptySpaces = [];
    for (var i = 0; i < level.dat.length; i++) {
        if(level.dat[i] === pslg.state.objectMasks["background"]){
            chromosome.emptySpaces.push(i);
        }
        else if(level.dat[i] !== pslg.state.objectMasks["wall"] + pslg.state.objectMasks["background"]){
            chromosome.notEmptySpaces.push(i);
        }
    }

    chromosome.fitness = undefined;
}

function ParallelLGEvolutionChromosomeCrossOver(chromosome, lgeChromosome){
    var swapPoint = Math.randomInt(chromosome.level.dat.length - 1);
    var initialData = {};
    initialData["dl"] = chromosome.dl;
    initialData["lgFeature"] = chromosome.lgFeature;
    
    var child1 = new pslg.ParallelChromosome(ParallelLGEvolutionChromosomeInitialize, 
        ParallelLGEvolutionChromosomeCrossOver, ParallelLGEvolutionChromosomeMutate, 
        ParallelLGEvolutionChromosomeCalculateFitness);
    var child2 = new pslg.ParallelChromosome(ParallelLGEvolutionChromosomeInitialize, 
        ParallelLGEvolutionChromosomeCrossOver, ParallelLGEvolutionChromosomeMutate, 
        ParallelLGEvolutionChromosomeCalculateFitness);
        
    child1.Initialize(initialData);
    child2.Initialize(initialData);
    for (var i = 0; i < chromosome.level.dat.length; i++) {
        if(i <= swapPoint){
            child1.level.dat[i] = chromosome.level.dat[i];
            child2.level.dat[i] = lgeChromosome.level.dat[i];
        }
        else
        {
            child1.level.dat[i] = lgeChromosome.level.dat[i];
            child2.level.dat[i] = chromosome.level.dat[i];
        }
    }

    child1.notEmptySpaces = [];
    child1.emptySpaces = [];
    child2.notEmptySpaces = [];
    child2.emptySpaces = [];
    for (var i = 0; i < child1.level.dat.length; i++) {
        if(child1.level.dat[i] === pslg.state.objectMasks["background"]){
            child1.emptySpaces.push(i);
        }
        else if(child1.level.dat[i] !== pslg.state.objectMasks["wall"]){
            child1.notEmptySpaces.push(i);
        }

        if(child2.level.dat[i] === pslg.state.objectMasks["background"]){
            child2.emptySpaces.push(i);
        }
        else if(child2.level.dat[i] !== pslg.state.objectMasks["wall"]){
            child2.notEmptySpaces.push(i);
        }
    }

    return [child1, child2];
};

function ParallelLGEvolutionChromosomeMutate(chromosome, ruleAnalyzer, state){
    var coverSize = pslg.LevelGenerator.emptySpaces[chromosome.dl].length * chromosome.lgFeature.coverPercentage;
    var initialData = {};
    initialData["dl"] = chromosome.dl;
    initialData["lgFeature"] = chromosome.lgFeature;
    var newChromosome = new pslg.ParallelChromosome(ParallelLGEvolutionChromosomeInitialize, 
        ParallelLGEvolutionChromosomeCrossOver, ParallelLGEvolutionChromosomeMutate, 
        ParallelLGEvolutionChromosomeCalculateFitness);
    
    newChromosome.Initialize(initialData);
    newChromosome.level = deepCloneLevel(chromosome.level);
    newChromosome.notEmptySpaces = chromosome.notEmptySpaces.clone();
    newChromosome.emptySpaces = chromosome.emptySpaces.clone();

    var randomValue = Math.random();
    var createProbability = (coverSize - chromosome.notEmptySpaces.length) / coverSize;
    var destroyProbability = (chromosome.notEmptySpaces.length) / coverSize;
    if(randomValue < createProbability * 0.7){
        newChromosome.emptySpaces.shuffle();
        var randomObject = ParallelLGEvolutionChromosomeRandomValue(ruleAnalyzer, chromosome.lgFeature);
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

    return newChromosome;
};

function ParallelLGEvolutionChromosomeCalculateFitness(chromosome, global){
    if(chromosome.fitness !== undefined){
        return chromosome.fitness;
    }

    global.env.state.levels = [chromosome.level];
    var previousSolutionLength = GetAverageSolutionLength(chromosome.dl, global.env.maxDifficulty);

    loadLevelFromState(global.env.state, 0);
    console.log("\t\tSolving level with difficulty" + (chromosome.dl + 1).toString());
    var result = bestfs(global.env.state.levels[0].dat, global.env.maxIterations);
    loadLevelFromState(global.env.state, 0);
    var randomResult = randomSolver(global.env.state.levels[0].dat, global.env.maxIterations);

    var randomFitness = RandomSolverScore(randomResult[0] === 1, chromosome.dl, randomResult[1].length);
    var solutionLengthScore = SolutionLengthScore(chromosome.dl, result[1].length - previousSolutionLength, 8);
    var solutionComplexityScore = SolutionComplexityScore(result[1], 3);
    var explorationScore = ExplorationScore(result[0] === 1, result[2], global.env.maxIterations);

    chromosome.fitness = result[0] + randomFitness + solutionLengthScore + solutionComplexityScore + explorationScore + 2;

    return chromosome.fitness;
};

function ParallelLGEvolutionFinishFunction(state, bestSolutions){
    state.levels = [bestSolutions[0].level];
    loadLevelFromState(state, 0);
}

