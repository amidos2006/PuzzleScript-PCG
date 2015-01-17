/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
*/

this.pslg = this.pslg||{};

(function()
{
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
    
    function ParallelChromosome(initialData){
        ParallelChromosome.Initialize(this, initialData);
    }
    
    function ParallelPopulation(){
        
    }
    
    ParallelPopulation.Initialize = function(populationSize, chromosomes){
        for (var i = 0; i < populationSize; i++) {
            chromosomes.push(new ParallelChromosome(ParallelChromosome.InitialData));
        }
    };
    
    ParallelPopulation.SelectionAlgorithm = function(chromosomes){
        var totalSum = 0;
        for (var i = 0; i < chromosomes.length; i++) {
            totalSum += chromosomes[i].fitness;
        }

        var probabilities = [];
        var currentSum = 0;
        for (var i = 0; i < chromosomes.length; i++) {
            currentSum += chromosomes[i].fitness;
            probabilities.push(currentSum / totalSum);
        }

        var index = -1;
        var randomValue = Math.random();
        for (var i = 0; i < probabilities.length; i++) {
            if(randomValue < probabilities[i]){
                index = i;
                break;
            }
        }

        return chromosomes[index];
    };
    
    ParallelPopulation.CalculateFitness = function(chromosomes){
        for (var i = 0; i < chromosomes.length; i++) {
            chromosomes[i].id = i;
        }
        ParallelChromosome.CalculateFitness(chromosomes, ParallelPopulation.NextPopulation);
    };
    
    ParallelPopulation.NextPopulation = function(chromosomes){
        ParallelGenetic.numberOfGenerations -= 1;
        if(ParallelGenetic.numberOfGenerations < 0){
            chromosomes.sort(FitnessSort);
            console.log("Genetic Algorithm is finished");
            ParallelGenetic.FinishFunction(chromosomes.slice(0, ParallelGenetic.numberOfBestChromosomes));
            return;
        }
        
        var newChromosomes = [];

        while(newChromosomes.length < chromosomes.length * (1 - ParallelGenetic.elitismRatio)){
            var parent1 = ParallelPopulation.SelectionAlgorithm(chromosomes);
            var parent2 = ParallelPopulation.SelectionAlgorithm(chromosomes);

            var children = [new ParallelChromosome(ParallelChromosome.InitialData), new ParallelChromosome(ParallelChromosome.InitialData)];;
            if(ParallelGenetic.crossoverRate === 0){
                var randomValue = Math.random();
                if(randomValue < ParallelGenetic.mutationRate){
                    ParallelChromosome.Mutate(children[0], parent1);
                }

                randomValue = Math.random();
                if(randomValue < ParallelGenetic.mutationRate){
                    ParallelChromosome.Mutate(children[1], parent2);
                }
            }
            else{
                var randomValue = Math.random();
                if(randomValue < ParallelGenetic.crossoverRate){
                    ParallelChromosome.CrossOver(children[0], children[1], parent1, parent2);

                    randomValue = Math.random();
                    if(randomValue < ParallelGenetic.mutationRate){
                        ParallelChromosome.Mutate(children[0], parent1);
                    }

                    randomValue = Math.random();
                    if(randomValue < ParallelGenetic.mutationRate){
                        ParallelChromosome.Mutate(children[1], parent2);
                    }
                }
                else
                {
                    children = [parent1, parent2];
                }
            }

            newChromosomes.push(children[0]);
            newChromosomes.push(children[1]);
        }

        chromosomes.sort(FitnessSort);
        var currentLength = newChromosomes.length;
        for(var i = 0; i < chromosomes.length - currentLength; i++){
            newChromosomes.push(chromosomes[i]);
        }
        
        console.log("Generations: " + (ParallelGenetic.numberOfGenerations).toString());
        ParallelPopulation.CalculateFitness(newChromosomes);
    };
    
    function ParallelGenetic(initialData){
        ParallelChromosome.Initialize = initialData.Initialize;
        ParallelChromosome.CrossOver = initialData.CrossOver;
        ParallelChromosome.Mutate = initialData.Mutation;
        ParallelChromosome.CalculateFitness = initialData.CalculateFitness;
        
        ParallelChromosome.InitialData = initialData.data;
    }
    
    ParallelGenetic.Evolve = function(numberOfBestChromosomes){
        ParallelGenetic.numberOfBestChromosomes = numberOfBestChromosomes;
        var chromosomes = [];
        
        ParallelPopulation.Initialize(ParallelGenetic.populationSize, chromosomes);
        ParallelPopulation.CalculateFitness(chromosomes);
    };

    ParallelGenetic.numberOfGenerations = 100;
    ParallelGenetic.sdError = 0;
    ParallelGenetic.populationSize = 50;
    ParallelGenetic.crossoverRate = 0.6;
    ParallelGenetic.mutationRate = 0.01;
    ParallelGenetic.elitismRatio = 0.2;
    ParallelGenetic.FinishFunction = undefined;
    
    /////////////////////////////
    //  Class Declaration
    /////////////////////////////
    pslg.ParallelGenetic = ParallelGenetic;
}());

//function FitnessSort(a, b) {
//    if (a.fitness > b.fitness) {
//            return -1;
//    }
//    else if (a.fitness < b.fitness) {
//            return 1;
//    }
//    else {
//            return 0;
//    }
//}
//
//function GetAverageSolutionLength(dl, totalDiffLevels){
//    var value = 0;
//    for (var i = 0; i <= dl; i++) {
//        var max = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 7, 2);
//        value += max;
//    }
//
//    return value;
//}
//
//function GetTrapeziumFunctionValue(x, hatPoint1, hatPoint2, maxValue, minValue){
//    if(x > 0 && x < hatPoint1){
//        return maxValue * x / hatPoint1 + minValue;
//    }
//    if(x > hatPoint2 && x < hatPoint1 + hatPoint2){
//        return maxValue - maxValue * (x - hatPoint2) / hatPoint1 + minValue;
//    }
//    if(x >= hatPoint1 && x <= hatPoint2){
//        return maxValue + minValue;
//    }
//
//    return minValue;
//}
//
//function RandomSolverScore(win, dl, length){
//    if(win){
//        if(length > 0){
//            return -Math.min(1, (dl + 1) / length);
//        }
//        return -1;
//    }
//    return 0;
//}
//
//function SolutionLengthScore(dl, diff, totalDiffLevels){
//    var min = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 4, 1);
//    var max = GetTrapeziumFunctionValue(dl, totalDiffLevels / 2, totalDiffLevels / 2, 7, 2);
//
//    var value = GetTrapeziumFunctionValue(Math.abs(diff), min, max, 1, 0);
//    if(diff < 0){
//        min = GetTrapeziumFunctionValue(dl, totalDiffLevels, totalDiffLevels, 2, 1);
//        value = -GetTrapeziumFunctionValue(Math.abs(diff), min, 10000, 1, 0);
//    }
//
//    return value;
//}
//
//function SolvedLevelsScore(numberOfSolved, totalDiffLevels){
//    return numberOfSolved / totalDiffLevels;
//}
//
//function SolutionComplexityScore(solution, analysisDegree){
//    if(solution.length === 0){
//        return -1;
//    }
//
//    analysisDegree = Math.min(analysisDegree, 4);
//    var analysisScore = [];
//    for (var i = 1; i <= analysisDegree; i++) {
//        var repeatingAmount = [];
//        for (var k = 0; k < pslg.differentCombinations[i].length; k++) {
//            repeatingAmount.push(0);
//            var array1 = pslg.differentCombinations[i][k][0];
//            for (var j = 0; j < solution.length - i; j++) {
//                var array2 = solution.slice(j, i);
//                if(array1.isEqual(array2)){
//                    repeatingAmount[k] += 1;
//                }
//            }
//        }
//
//        analysisScore.push(0);
//        for (var j = 0; j < repeatingAmount.length; j++) {
//            analysisScore[i - 1] += Math.abs(repeatingAmount[j] - solution.length / repeatingAmount.length);
//        }
//        analysisScore[i - 1] /= 2 * (repeatingAmount.length - 1) * solution.length / repeatingAmount.length;
//    }
//
//    return -analysisScore.avg();
//}
//
//function ExplorationScore(win, iterations, maxIterations){
//    if(win){
//        return 1;
//    }
//    return iterations / maxIterations;
//}
//
//function ParallelLGEvolutionChromosomeRandomValue(ruleAnalyzer, lgFeature){
//    var criticalObjects = {};
//    var ruleObjects = {};
//    for (var i = 0; i < ruleAnalyzer.ruleObjects.length; i++){
//        var obj = ruleAnalyzer.ruleObjects[i];
//        var result = ruleAnalyzer.CheckCriticalObject(obj);
//        switch(result){
//            case 0:
//                //useless object in rule
//                break;
//            case 1:
//                ruleObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
//                break;
//            case 2:
//                ruleObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
//                break;
//            case 3:
//                criticalObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
//                break;
//        }
//    }
//
//    var criticalNumber = Object.keys(criticalObjects).length * lgFeature.criticalWeight;
//    var ruleNumber = Object.keys(ruleObjects).length * lgFeature.ruleWeight;
//    var solidNumber = ruleAnalyzer.solidObjects.length * (1 - lgFeature.criticalWeight - lgFeature.ruleWeight);
//    var totalNumber = criticalNumber + ruleNumber + solidNumber;
//
//    var criticalPropability = {};
//    var objectAccumlator = 0;
//    for (var obj in criticalObjects){
//        objectAccumlator += ruleAnalyzer.objectPriority[obj];
//        criticalPropability[obj] = objectAccumlator;
//    }
//    for (var obj in criticalPropability){
//        criticalPropability[obj] /= objectAccumlator;
//    }
//
//    var rulePropability = {};
//    objectAccumlator = 0;
//    for(var obj in ruleObjects){
//        objectAccumlator += ruleAnalyzer.objectPriority[obj];
//        rulePropability[obj] = objectAccumlator;
//    }
//    for (var obj in rulePropability){
//        rulePropability[obj] /= objectAccumlator;
//    }
//
//    var randomValue = Math.random();
//
//    if(randomValue < criticalNumber / totalNumber){
//        randomValue = Math.random();
//        for (var obj in criticalPropability){
//            if(randomValue < criticalPropability[obj]){
//                return obj;
//            }
//        }
//    }
//    else if(randomValue < (criticalNumber + ruleNumber) / totalNumber){
//        randomValue = Math.random();
//        for (var obj in rulePropability){
//            if(randomValue < rulePropability[obj]){
//                return obj;
//            }
//        }
//    }
//
//    return ruleAnalyzer.solidObjects.rand();
//};
//
//function ParallelLGEvolutionChromosomeInitialize(chromosome, intialData){
//    chromosome.dl = intialData.dl;
//    chromosome.lgFeature = intialData.lgFeature;
//    var lg = new pslg.LevelGenerator(chromosome.lgFeature);
//    chromosome.level = lg.GenerateLevel(chromosome.dl, pslg.ruleAnalyzer, pslg.state);
//    chromosome.notEmptySpaces = [];
//    chromosome.emptySpaces = [];
//    for (var i = 0; i < level.dat.length; i++) {
//        if(level.dat[i] === pslg.state.objectMasks["background"]){
//            chromosome.emptySpaces.push(i);
//        }
//        else if(level.dat[i] !== pslg.state.objectMasks["wall"] + pslg.state.objectMasks["background"]){
//            chromosome.notEmptySpaces.push(i);
//        }
//    }
//
//    chromosome.fitness = undefined;
//}
//
//function ParallelLGEvolutionChromosomeCrossOver(chromosome, lgeChromosome){
//    var swapPoint = Math.randomInt(chromosome.level.dat.length - 1);
//    var initialData = {};
//    initialData["dl"] = chromosome.dl;
//    initialData["lgFeature"] = chromosome.lgFeature;
//    
//    var child1 = new pslg.ParallelChromosome();
//    var child2 = new pslg.ParallelChromosome();
//        
//    ParallelLGEvolutionChromosomeInitialize(child1, initialData);
//    ParallelLGEvolutionChromosomeInitialize(child2, initialData);
//    for (var i = 0; i < chromosome.level.dat.length; i++) {
//        if(i <= swapPoint){
//            child1.level.dat[i] = chromosome.level.dat[i];
//            child2.level.dat[i] = lgeChromosome.level.dat[i];
//        }
//        else
//        {
//            child1.level.dat[i] = lgeChromosome.level.dat[i];
//            child2.level.dat[i] = chromosome.level.dat[i];
//        }
//    }
//
//    child1.notEmptySpaces = [];
//    child1.emptySpaces = [];
//    child2.notEmptySpaces = [];
//    child2.emptySpaces = [];
//    for (var i = 0; i < child1.level.dat.length; i++) {
//        if(child1.level.dat[i] === pslg.state.objectMasks["background"]){
//            child1.emptySpaces.push(i);
//        }
//        else if(child1.level.dat[i] !== pslg.state.objectMasks["wall"]){
//            child1.notEmptySpaces.push(i);
//        }
//
//        if(child2.level.dat[i] === pslg.state.objectMasks["background"]){
//            child2.emptySpaces.push(i);
//        }
//        else if(child2.level.dat[i] !== pslg.state.objectMasks["wall"]){
//            child2.notEmptySpaces.push(i);
//        }
//    }
//
//    return [child1, child2];
//};
//
//function ParallelLGEvolutionChromosomeMutate(chromosome, ruleAnalyzer, state){
//    var coverSize = pslg.LevelGenerator.emptySpaces[chromosome.dl].length * chromosome.lgFeature.coverPercentage;
//    var initialData = {};
//    initialData["dl"] = chromosome.dl;
//    initialData["lgFeature"] = chromosome.lgFeature;
//    var newChromosome = new pslg.ParallelChromosome(-1);
//    
//    ParallelLGEvolutionChromosomeInitialize(newChromosome, initialData);
//    newChromosome.level = deepCloneLevel(chromosome.level);
//    newChromosome.notEmptySpaces = chromosome.notEmptySpaces.clone();
//    newChromosome.emptySpaces = chromosome.emptySpaces.clone();
//
//    var randomValue = Math.random();
//    var createProbability = (coverSize - chromosome.notEmptySpaces.length) / coverSize;
//    var destroyProbability = (chromosome.notEmptySpaces.length) / coverSize;
//    if(randomValue < createProbability * 0.7){
//        newChromosome.emptySpaces.shuffle();
//        var randomObject = ParallelLGEvolutionChromosomeRandomValue(ruleAnalyzer, chromosome.lgFeature);
//        var randomEmptySpace = newChromosome.emptySpaces[0];
//        newChromosome.emptySpaces.splice(0, 1);
//        newChromosome.notEmptySpaces.push(randomEmptySpace);
//
//        newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomEmptySpace] | state.objectMasks[randomObject];
//    }
//    else if(randomValue < destroyProbability * 0.7){
//        newChromosome.notEmptySpaces.shuffle();
//        var randomNonEmptySpace = newChromosome.notEmptySpaces[0];
//        newChromosome.notEmptySpaces.splice(0, 1);
//        newChromosome.emptySpaces.push(randomNonEmptySpace);
//
//        newChromosome.level.dat[randomNonEmptySpace] = state.objectMasks["background"];
//    }
//    else{
//        newChromosome.notEmptySpaces.shuffle();
//        newChromosome.emptySpaces.shuffle();
//
//        var randomNotEmptySpace = newChromosome.notEmptySpaces[0];
//        var randomEmptySpace = newChromosome.emptySpaces[1];
//
//        newChromosome.notEmptySpaces.splice(0, 1);
//        newChromosome.emptySpaces.splice(0, 1);
//
//        newChromosome.emptySpaces.push(randomNonEmptySpace);
//        newChromosome.notEmptySpaces.push(randomEmptySpace);
//
//        newChromosome.level.dat[randomEmptySpace] = newChromosome.level.dat[randomNotEmptySpace];
//        newChromosome.level.dat[randomNotEmptySpace] = state.objectMasks["background"];;
//    }
//
//    return newChromosome;
//};
//
//function ParallelLGEvolutionChromosomeCalculateFitness(chromosome){
//    if(chromosome.fitness !== undefined){
//        return chromosome.fitness;
//    }
//
//    state.levels = [chromosome.level];
//    var previousSolutionLength = GetAverageSolutionLength(chromosome.dl, maxDifficulty);
//    loadLevelFromState(state, 0);
//    var result = bestfs(state.levels[0].dat, maxIterations);
//    loadLevelFromState(state, 0);
//    var randomResult = randomSolver(state.levels[0].dat, maxIterations);
//    var randomFitness = RandomSolverScore(randomResult[0] === 1, chromosome.dl, randomResult[1].length);
//    var solutionLengthScore = SolutionLengthScore(chromosome.dl, result[1].length - previousSolutionLength, 8);
//    var solutionComplexityScore = SolutionComplexityScore(result[1], 3);
//    var explorationScore = ExplorationScore(result[0] === 1, result[2], maxIterations);
//
//    chromosome.fitness = result[0] + randomFitness + solutionLengthScore + solutionComplexityScore + explorationScore + 2;
//    
//    return chromosome.fitness;
//};
//
//function ParallelLGEvolutionFinishFunction(state, bestSolutions){
//    state.levels = [bestSolutions[0].level];
//    loadLevelFromState(state, 0);
//}
//
