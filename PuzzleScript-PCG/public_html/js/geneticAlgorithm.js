/* 
 * Genetic Algorithm
 * Author: Ahmed Abdel Samea Khalifa
 * 
 * This contains methods to evolve new rules and levels and parameters
 */

this.pslg = this.pslg||{};

(function()
{
    var state = undefined;
    var ruleAnalyzer = undefined;
    
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
    
    function LGFeatureChromosome(){
        this.genes = [];
        this.fitness = undefined;
        
        this.genes.push(LGFeatureChromosome.GetRandomGeneValue(i, 0));
        for (var i = 1; i < 6; i++) {
            this.genes.push(LGFeatureChromosome.GetRandomGeneValue(i, this.genes[i - 1]));
        }
    }
    
    LGFeatureChromosome.GetRandomGeneValue = function(index, pregene){
        switch(index){
            case 0:
                return Math.random() * 0.6 + 0.2;
            case 1:
                return Math.randomInt(4);
            case 2:
                return Math.random() * 0.75 + 0.25;
            case 3:
                return Math.random() * 0.5;
            case 4:
                return Math.random() * 0.5 + 0.2;
        }
        return Math.random() * (1 - pregene);
    };
    
    LGFeatureChromosome.prototype.FixProbabilities = function(thirdProbability){
        var total = this.genes[this.genes.length - 1] + this.genes[this.genes.length - 2] + thirdProbability;
        if (total === 0){
            total = 1;
        }
        this.genes[this.genes.length - 1] /= total;
        this.genes[this.genes.length - 2] /= total;
    };
    
    LGFeatureChromosome.prototype.CalculateFitness = function(ruleAnalyzer, state){
        if(this.fitness !== undefined){
            return this.fitness;
        }
        
        var levelGenerator = new pslg.LevelGenerator(new pslg.LGFeatures(this.genes));
        state.levels = levelGenerator.GenerateLevels(ruleAnalyzer, state);
        
        var randomFitness = [];
        var solutionLengthScore = [];
        var solutionComplexityScore = [];
        var explorationScore = [];
        var previousSolutionLength = 0;
        var solvedLevelScore = 0;
        var totalDiffLevels = pslg.LevelGenerator.levelsOutline.length;
        for(var i = 0; i < state.levels.length; i++){
            var dl = Math.floor(i / pslg.LevelGenerator.numberOfLevelsPerDifficulty);
            loadLevelFromState(state, i);
            console.log("\t\tSolving level " + (i + 1).toString());
            var result = bestfs(state.levels[i].dat, LGParameterEvolution.maxIterationSolver);
            loadLevelFromState(state, i);
            var randomResult = randomSolver(state.levels[i].dat, LGParameterEvolution.maxIterationSolver);
            solvedLevelScore += result[0];
            
            randomFitness.push(RandomSolverScore(randomResult[0] === 1, dl, randomResult[1].length));
            solutionLengthScore.push(SolutionLengthScore(dl, result[1].length - previousSolutionLength, totalDiffLevels));
            solutionComplexityScore.push(SolutionComplexityScore(result[1], 3));
            explorationScore.push(ExplorationScore(result[0] === 1, result[2], LGParameterEvolution.maxIterationSolver));
            
            previousSolutionLength = result[1].length;
        }
        
        solvedLevelScore = SolvedLevelsScore(solvedLevelScore, totalDiffLevels);
        
        this.fitness = solvedLevelScore + randomFitness.avg() + solutionLengthScore.avg() + solutionComplexityScore.avg() + explorationScore.avg() + 2;
        
        return this.fitness;
    };
    
    LGFeatureChromosome.prototype.CrossOver = function(lgFeature){
        var newChromosome1 = new LGFeatureChromosome();
        var newChromosome2 = new LGFeatureChromosome();
        var pointOfSwap = Math.randomInt(newChromosome1.genes.length - 1);
        
        for (var i = 0; i < newChromosome1.genes.length; i++) {
            if(i <= pointOfSwap){
                newChromosome1.genes[i] = this.genes[i];
                newChromosome2.genes[i] = lgFeature.genes[i];
            }
            else{
                newChromosome1.genes[i] = lgFeature.genes[i];
                newChromosome2.genes[i] = this.genes[i];
            }
        }
        
        var thirdProbability = 1 - this.genes[this.genes.length - 1] - this.genes[this.genes.length - 2];
        newChromosome2.FixProbabilities(thirdProbability);
        thirdProbability = 1 - lgFeature.genes[lgFeature.genes.length - 1] - lgFeature.genes[lgFeature.genes.length - 2];
        newChromosome1.FixProbabilities(thirdProbability);
        
        return [newChromosome1, newChromosome2];
    };
    
    LGFeatureChromosome.prototype.Mutate = function(){
        var newChromosome = new LGFeatureChromosome();
        newChromosome.genes = this.genes.clone();
        var randomIndex = Math.randomInt(this.genes.length);
        if(randomIndex > 0){
            newChromosome.genes[randomIndex] = LGFeatureChromosome.GetRandomGeneValue(randomIndex, newChromosome.genes[randomIndex - 1]);
        }
        else{
            newChromosome.genes[randomIndex] = LGFeatureChromosome.GetRandomGeneValue(randomIndex, 0);
        }
        
        var thirdProbability = 1 - this.genes[this.genes.length - 1] - this.genes[this.genes.length - 2];
        newChromosome.FixProbabilities(thirdProbability);
        
        return newChromosome;
    };
    
    function LGFeaturePopulation(populationSize){
        this.populationSize = populationSize;
        this.chromosomes = [];
    }
    
    LGFeaturePopulation.prototype.InitializeRandom = function(){
        for (var i = 0; i < this.populationSize; i++) {
            this.chromosomes.push(new LGFeatureChromosome());
        }
    };
    
    LGFeaturePopulation.prototype.NextPopulation = function(elitism, crossoverRate, mutationRate){
        var newPopulation = new LGFeaturePopulation(this.populationSize);
        
        for (var i = 0; i < this.chromosomes.length; i++) {
            console.log("\tChromosome number: " + (i + 1).toString());
            this.chromosomes[i].CalculateFitness(pslg.ruleAnalyzer, pslg.state);
            console.log("\tFitness Score: " + this.chromosomes[i].fitness);
        }
        
        while(newPopulation.chromosomes.length < newPopulation.populationSize * (1 - elitism)){
            var parent1 = this.SelectionAlgorithm();
            var parent2 = this.SelectionAlgorithm();
            
            var children;
            var randomValue = Math.random();
            if(randomValue < crossoverRate){
                children = parent1.CrossOver(parent2);
                
                randomValue = Math.random();
                if(randomValue < mutationRate){
                    children[0] = children[0].Mutate();
                }
                
                randomValue = Math.random();
                if(randomValue < mutationRate){
                    children[1] = children[1].Mutate();
                }
            }
            else
            {
                children = [parent1, parent2];
            }
            
            newPopulation.chromosomes.push(children[0]);
            newPopulation.chromosomes.push(children[1]);
        }
        
        this.chromosomes.sort(FitnessSort);
        for(var i = 0; i < newPopulation.populationSize - newPopulation.chromosomes.length; i++){
            newPopulation.chromosomes.push(this.chromosomes[i]);
        }
        
        for(var i = 0; i < newPopulation.chromosomes.length; i++){
            newPopulation.chromosomes[i].fitness = undefined;
        }
        
        return newPopulation;
    };
    
    LGFeaturePopulation.prototype.SelectionAlgorithm = function(){
        var totalSum = 0;
        for (var i = 0; i < this.chromosomes.length; i++) {
            totalSum += this.chromosomes[i].fitness;
        }
        
        var probabilities = [];
        var currentSum = 0;
        for (var i = 0; i < this.chromosomes.length; i++) {
            currentSum += this.chromosomes[i].fitness;
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
        
        return this.chromosomes[index];
    };
    
    function LGParameterEvolution(numberOfGenerations, populationSize){
        this.numberOfGenerations = numberOfGenerations;
        this.populationSize = populationSize;
    }
    
    LGParameterEvolution.prototype.Evolve = function(numberOfBestChromosomes){
        var currentPopulation = new LGFeaturePopulation(this.populationSize);
        currentPopulation.InitializeRandom();
        for(var i = 0; i < this.numberOfGenerations; i++){
            console.log("Generation number: " + (i + 1).toString());
            currentPopulation = currentPopulation.NextPopulation(LGParameterEvolution.elitismRatio, LGParameterEvolution.crossoverRate, LGParameterEvolution.mutationRate);
        }
        
        for (var i = 0; i < currentPopulation.chromosomes.length; i++) {
            currentPopulation.chromosomes[i].CalculateFitness(pslg.ruleAnalyzer, pslg.state);
        }
        
        currentPopulation.chromosomes.sort(FitnessSort);
        
        return currentPopulation.chromosomes.slice(0, numberOfBestChromosomes);
    };
    
    LGParameterEvolution.crossoverRate = 0.6;
    LGParameterEvolution.mutationRate = 0.01;
    LGParameterEvolution.elitismRatio = 0.2;
    LGParameterEvolution.maxIterationSolver = 1000;
    
    function LGEvolutionChromosome(dl, level){
        this.dl = dl;
        if(level === undefined){
            this.level = deepCloneLevel(pslg.LevelGenerator.levelsOutline[dl]);
            this.notEmptySpaces = [];
            this.emptySpaces = pslg.LevelGenerator.emptySpaces[dl].clone();
        }
        else{
            this.level = deepCloneLevel(level);
            this.notEmptySpaces = [];
            this.emptySpaces = [];
            for (var i = 0; i < level.dat.length; i++) {
                if(level.dat[i] === pslg.state.objectMasks["background"]){
                    this.emptySpaces.push(i);
                }
                else if(level.dat[i] !== pslg.state.objectMasks["wall"] + pslg.state.objectMasks["background"]){
                    this.notEmptySpaces.push(i);
                }
            }
        }
        
        this.fitness = undefined;
    }
    
    LGEvolutionChromosome.RandomValue = function(ruleAnalyzer){
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
        
        var criticalNumber = Object.keys(criticalObjects).length * LGEvolution.lgFeature.criticalWeight;
        var ruleNumber = Object.keys(ruleObjects).length * LGEvolution.lgFeature.ruleWeight;
        var solidNumber = ruleAnalyzer.solidObjects.length * (1 - LGEvolution.lgFeature.criticalWeight - LGEvolution.lgFeature.ruleWeight);
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
    
    LGEvolutionChromosome.prototype.RandomInitialize = function(){
        var newChromosome = this.Mutate(pslg.ruleAnalyzer, pslg.state, LGEvolution.lgFeature.coverPercentage);
        this.level = newChromosome.level;
        this.emptySpaces = newChromosome.emptySpaces;
        this.notEmptySpaces = newChromosome.notEmptySpaces;
    };
    
    LGEvolutionChromosome.prototype.CrossOver = function(lgeChromosome){
        var swapPoint = Math.randomInt(this.level.dat.length - 1);
        var child1 = new LGEvolutionChromosome(this.dl);
        var child2 = new LGEvolutionChromosome(this.dl);
        for (var i = 0; i < this.level.dat.length; i++) {
            if(i <= swapPoint){
                child1.level.dat[i] = this.level.dat[i];
                child2.level.dat[i] = lgeChromosome.level.dat[i];
            }
            else
            {
                child1.level.dat[i] = lgeChromosome.level.dat[i];
                child2.level.dat[i] = this.level.dat[i];
            }
        }
        
        child1.notEmptySpaces = [];
        child1.emptySpaces = [];
        child2.notEmptySpaces = [];
        child2.emptySpaces = [];
        for (var i = 0; i < child1.dat.length; i++) {
            if(child1.level.dat[i] === pslg.state.objectMasks["background"]){
                child1.emptySpaces.push(i);
            }
            else if(child1.level.dat[i] !== pslg.state.objectMasks["wall"]){
                child1.notEmptySpaces.push(i);
            }
            
            if(child2.level.dat[i] === pslg.state.objectMasks["background"]){
                child2.emptySpaces.push(i);
            }
            else if(child21.level.dat[i] !== pslg.state.objectMasks["wall"]){
                child2.notEmptySpaces.push(i);
            }
        }
        
        return [child1, child2];
    };
    
    LGEvolutionChromosome.prototype.Mutate = function(ruleAnalyzer, state, coverPercentage){
        var coverSize = pslg.LevelGenerator.emptySpaces[this.dl].length * coverPercentage;
        var newChromosome = new LGEvolutionChromosome(this.dl);
        newChromosome.level = deepCloneLevel(this.level);
        newChromosome.notEmptySpaces = this.notEmptySpaces.clone();
        newChromosome.emptySpaces = this.emptySpaces.clone();
        
        var randomValue = Math.random();
        var createProbability = (coverSize - this.notEmptySpaces.length) / coverSize;
        var destroyProbability = (this.notEmptySpaces.length) / coverSize;
        if(randomValue < createProbability * 0.7){
            newChromosome.emptySpaces.shuffle();
            var randomObject = LGEvolutionChromosome.RandomValue(ruleAnalyzer);
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
    
    LGEvolutionChromosome.prototype.CalculateFitness = function(state){
        if(this.fitness !== undefined){
            return this.fitness;
        }
        
        state.levels = [this.level];
        
        var totalDiffLevels = pslg.LevelGenerator.levelsOutline.length;
        var previousSolutionLength = GetAverageSolutionLength(this.dl, totalDiffLevels);
        
        loadLevelFromState(state, 0);
        console.log("\t\tSolving level with difficulty" + (this.dl + 1).toString());
        var result = bestfs(state.levels[0].dat, LGEvolution.maxIterations);
        loadLevelFromState(state, 0);
        var randomResult = randomSolver(state.levels[0].dat, LGEvolution.maxIterations);

        var randomFitness = RandomSolverScore(randomResult[0] === 1, this.dl, randomResult[1].length);
        var solutionLengthScore = SolutionLengthScore(this.dl, result[1].length - previousSolutionLength, totalDiffLevels);
        var solutionComplexityScore = SolutionComplexityScore(result[1], 3);
        var explorationScore = ExplorationScore(result[0] === 1, result[2], LGEvolution.maxIterations);
        
        this.fitness = result[0] + randomFitness + solutionLengthScore + solutionComplexityScore + explorationScore + 2;
        
        return this.fitness;
    };
    
    function LGEvolutionPopulation(populationSize){
        this.populationSize = populationSize;
        this.chromosomes = [];
    }
    
    LGEvolutionPopulation.prototype.InitializeRandom = function(dl){
        for (var i = 0; i < this.populationSize; i++) {
            this.chromosomes.push(new LGEvolutionChromosome(dl));
        }
    };
    
    LGEvolutionPopulation.prototype.InitializeLevelGenerator = function(dl){
        var lg = new pslg.LevelGenerator(LGEvolution.lgFeature);
        for (var i = 0; i < this.populationSize; i++) {
            this.chromosomes.push(new LGEvolutionChromosome(dl, lg.GenerateLevel(dl, pslg.ruleAnalyzer, pslg.state)));
        }
    };
    
    LGEvolutionPopulation.prototype.NextPopulation = function(elitism, crossoverRate, mutationRate){
        var newPopulation = new LGEvolutionPopulation(this.populationSize);
        
        for (var i = 0; i < this.chromosomes.length; i++) {
            console.log("\tChromosome number: " + (i + 1).toString());
            this.chromosomes[i].CalculateFitness(pslg.state);
            console.log("\tFitness Score: " + this.chromosomes[i].fitness);
        }
        
        while(newPopulation.chromosomes.length < newPopulation.populationSize * (1 - elitism)){
            var parent1 = this.SelectionAlgorithm();
            var parent2 = this.SelectionAlgorithm();
            
            var children;
            if(crossoverRate === 0){
                children = [parent1, parent2];
                var randomValue = Math.random();
                if(randomValue < mutationRate){
                    children[0] = children[0].Mutate(pslg.ruleAnalyzer, pslg.state, LGEvolution.lgFeature.coverPercentage);
                }

                randomValue = Math.random();
                if(randomValue < mutationRate){
                    children[1] = children[1].Mutate(pslg.ruleAnalyzer, pslg.state, LGEvolution.lgFeature.coverPercentage);
                }
            }
            else{
                var randomValue = Math.random();
                if(randomValue < crossoverRate){
                    children = parent1.CrossOver(parent2);

                    randomValue = Math.random();
                    if(randomValue < mutationRate){
                        children[0] = children[0].Mutate();
                    }

                    randomValue = Math.random();
                    if(randomValue < mutationRate){
                        children[1] = children[1].Mutate();
                    }
                }
                else
                {
                    children = [parent1, parent2];
                }
            }
            
            newPopulation.chromosomes.push(children[0]);
            newPopulation.chromosomes.push(children[1]);
        }
        
        this.chromosomes.sort(FitnessSort);
        for(var i = 0; i < newPopulation.populationSize - newPopulation.chromosomes.length; i++){
            newPopulation.chromosomes.push(this.chromosomes[i]);
        }
        
        return newPopulation;
    };
    
    LGEvolutionPopulation.prototype.SelectionAlgorithm = function(){
        var totalSum = 0;
        for (var i = 0; i < this.chromosomes.length; i++) {
            totalSum += this.chromosomes[i].fitness;
        }
        
        var probabilities = [];
        var currentSum = 0;
        for (var i = 0; i < this.chromosomes.length; i++) {
            currentSum += this.chromosomes[i].fitness;
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
        
        return this.chromosomes[index];
    };
    
    function LGEvolution(numberOfGenerations, populationSize){
        this.numberOfGenerations = numberOfGenerations;
        this.populationSize = populationSize;
    }
    
    LGEvolution.prototype.Evolve = function(numberOfBestChromosomes, dl, isRandom){
        var currentPopulation = new LGEvolutionPopulation(this.populationSize);
        if(isRandom){
            currentPopulation.InitializeRandom(dl);
        }
        else{
            currentPopulation.InitializeLevelGenerator(dl);
        }
        
        for(var i = 0; i < this.numberOfGenerations; i++){
            console.log("Generation number: " + (i + 1).toString());
            currentPopulation = currentPopulation.NextPopulation(LGEvolution.elitismRatio, LGEvolution.crossoverRate, LGEvolution.mutationRate);
        }
        
        for (var i = 0; i < currentPopulation.chromosomes.length; i++) {
            currentPopulation.chromosomes[i].CalculateFitness(pslg.state);
        }
        
        currentPopulation.chromosomes.sort(FitnessSort);
        
        return currentPopulation.chromosomes.slice(0, numberOfBestChromosomes);
    };
    
    LGEvolution.maxIterations = 1000;
    LGEvolution.crossoverRate = 0.6;
    LGEvolution.mutationRate = 0.01;
    LGEvolution.elitismRatio = 0.2;
    LGEvolution.lgFeature = new pslg.LGFeatures([0.4, 1, 0.5, 0.5, 0.6, 0.3]);
    
    /////////////////////////////
    //  Class Declaration
    /////////////////////////////
    pslg.state = state;
    pslg.ruleAnalyzer = ruleAnalyzer;
    pslg.LGParameterEvolution = LGParameterEvolution;
    pslg.LGEvolution = LGEvolution;
    pslg.InitializeSoultionAnalysis = InitializeSoultionAnalysis;
    
}());
