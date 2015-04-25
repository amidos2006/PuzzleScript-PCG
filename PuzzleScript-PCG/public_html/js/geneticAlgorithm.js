/* 
 * Genetic Algorithm
 * Author: Ahmed Abdel Samea Khalifa
 * 
 * This contains methods to evolve new rules and levels and parameters
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
    
    function Chromosome(initialData){
        Chromosome.Initialize(this, initialData);
        this.age = 0;
    }
    
    function Population(populationSize){
        this.populationSize = populationSize;
        this.chromosomes = [];
    }
    
    Population.prototype.Initialize = function(){
        var diffAmount = Math.floor((GeneticAlgorithm.randomInitializationSize + GeneticAlgorithm.mutatedInitializationSize) * 
                this.populationSize);
        var mutatedSize = Math.floor(GeneticAlgorithm.mutatedInitializationSize * this.populationSize);
        for (var i = 0; i < this.populationSize - diffAmount; i++) {
            this.chromosomes.push(new Chromosome(Chromosome.InitialData));
        }
        for (var i = 0; i < diffAmount; i++) {
            if(i >= mutatedSize){
                Chromosome.InitialData.emptyInitialize = true;
            }
            var newChromosome = new Chromosome(Chromosome.InitialData);
            for (var j = 0; j < 20; j++) {
                Chromosome.Mutate(newChromosome, newChromosome);
            }
            this.chromosomes.push(newChromosome);
        }
    };
    
    Population.prototype.SelectionAlgorithm = function(){
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
    
    Population.prototype.NextPopulation = function(elitism, crossoverRate, mutationRate){
        var newPopulation = new Population(this.populationSize);
        
        for (var i = 0; i < this.chromosomes.length; i++) {
            //console.log("\tChromosome number: " + (i + 1).toString());
            this.chromosomes[i].age += 1;
            Chromosome.CalculateFitness(this.chromosomes[i]);
            //console.log("\tFitness Score: " + this.chromosomes[i].fitness);
        }
        
        while(newPopulation.chromosomes.length < newPopulation.populationSize){
            var parent1 = this.SelectionAlgorithm();
            var parent2 = this.SelectionAlgorithm();
            
            var children = [new Chromosome(Chromosome.InitialData), new Chromosome(Chromosome.InitialData)];;
            if(crossoverRate === 0){
                var randomValue = Math.random();
                if(randomValue < mutationRate){
                    Chromosome.Mutate(children[0], parent1);
                }

                randomValue = Math.random();
                if(randomValue < mutationRate){
                    Chromosome.Mutate(children[1], parent2);
                }
            }
            else{
                var randomValue = Math.random();
                if(randomValue < crossoverRate){
                    Chromosome.CrossOver(children[0], children[1], parent1, parent2);

                    randomValue = Math.random();
                    if(randomValue < mutationRate){
                        Chromosome.Mutate(children[0], parent1);
                    }

                    randomValue = Math.random();
                    if(randomValue < mutationRate){
                        Chromosome.Mutate(children[1], parent2);
                    }
                }
                else
                {
                    Chromosome.Clone(children[0], parent1);
                    Chromosome.Clone(children[1], parent2);
                }
            }
            
            newPopulation.chromosomes.push(children[0]);
            newPopulation.chromosomes.push(children[1]);
        }
        
        this.chromosomes.sort(FitnessSort);
        for (var i = 0; i < elitism * newPopulation.populationSize; i++) {
            newPopulation.chromosomes.splice(newPopulation.populationSize - i - 1, 1);
        }
        var currentLength = newPopulation.chromosomes.length;
        for(var i = 0; i < newPopulation.populationSize - currentLength; i++){
            newPopulation.chromosomes.push(this.chromosomes[i]);
        }
        
        return newPopulation;
    };
    
    function RuleNextPopulation(elitism, crossoverRate, mutationRate){
        var newPopulation = new Population(this.populationSize);
        
        for (var i = 0; i < this.chromosomes.length; i++) {
            //console.log("\tChromosome number: " + (i + 1).toString());
            this.chromosomes[i].age += 1;
            Chromosome.CalculateFitness(this.chromosomes[i]);
            //console.log("\tFitness Score: " + this.chromosomes[i].fitness);
        }
        
        while(newPopulation.chromosomes.length < newPopulation.populationSize){
            var parent1 = this.SelectionAlgorithm();
            var parent2 = this.SelectionAlgorithm();
            var i = 0;
            while(!Chromosome.Equal(parent1, parent2) && i < 20){
                parent2 = this.SelectionAlgorithm();
            }
            
            var children = [new Chromosome(Chromosome.InitialData), new Chromosome(Chromosome.InitialData)];;
            if(crossoverRate === 0){
                var randomValue = Math.random();
                if(randomValue < mutationRate){
                    Chromosome.Mutate(children[0], parent1);
                }

                randomValue = Math.random();
                if(randomValue < mutationRate){
                    Chromosome.Mutate(children[1], parent2);
                }
            }
            else{
                var randomValue = Math.random();
                if(randomValue < crossoverRate && i < 20){
                    Chromosome.CrossOver(children[0], children[1], parent1, parent2);
                }
                else
                {
                    Chromosome.Clone(children[0], parent1);
                    var randomValue = Math.random();
                    if(randomValue < mutationRate){
                        Chromosome.Mutate(children[1], parent2);
                    }
                    
                    Chromosome.Clone(children[1], parent2);
                    randomValue = Math.random();
                    if(randomValue < mutationRate){
                        Chromosome.Mutate(children[1], parent2);
                    }
                }
            }
            
            newPopulation.chromosomes.push(children[0]);
            newPopulation.chromosomes.push(children[1]);
        }
        
        this.chromosomes.sort(FitnessSort);
        for (var i = 0; i < elitism * newPopulation.populationSize; i++) {
            newPopulation.chromosomes.splice(newPopulation.populationSize - i - 1, 1);
        }
        var currentLength = newPopulation.chromosomes.length;
        for(var i = 0; i < newPopulation.populationSize - currentLength; i++){
            newPopulation.chromosomes.push(this.chromosomes[i]);
        }
        
        return newPopulation;
    }
    
    function GeneticAlgorithm(initialData){
        Chromosome.Initialize = initialData.Initialize;
        Chromosome.Clone = initialData.Clone;
        Chromosome.CrossOver = initialData.CrossOver;
        Chromosome.Mutate = initialData.Mutation;
        Chromosome.CalculateFitness = initialData.CalculateFitness;
        
        Chromosome.InitialData = initialData.data;
        if(initialData.Equal){
            Chromosome.Equal = initialData.Equal;
            Population.prototype.NextPopulation = RuleNextPopulation;
        }
    }
    
    GeneticAlgorithm.prototype.Evolve = function(numberOfBestChromosomes){
        var currentPopulation = new Population(GeneticAlgorithm.populationSize);
        currentPopulation.Initialize();
        Chromosome.InitialData.emptyInitialize = true;
        
        for(var i = 0; i < GeneticAlgorithm.numberOfGenerations; i++){
            console.log("Generation number: " + (i + 1).toString());      
            var newPopulation = currentPopulation.NextPopulation(GeneticAlgorithm.elitismRatio, GeneticAlgorithm.crossoverRate, GeneticAlgorithm.mutationRate);
            var sdError = [];
            for (var j = 0; j < GeneticAlgorithm.populationSize; j++) {
                sdError.push(currentPopulation.chromosomes[j].fitness);
            }
            console.log("current sd: " + sdError.sd().toString() + 
                " ,average fitness: " + sdError.avg().toString() + 
                " ,best fitness: " + sdError.max().toString() +
                " ,min fitness: " + sdError.min().toString());
            if(sdError.sd() <= GeneticAlgorithm.sdError){
                break;
            }
            currentPopulation = newPopulation;
        }
        
        for (var i = 0; i < currentPopulation.chromosomes.length; i++) {
            Chromosome.CalculateFitness(currentPopulation.chromosomes[i]);
        }
        
        currentPopulation.chromosomes.sort(FitnessSort);
        
        return currentPopulation.chromosomes.slice(0, numberOfBestChromosomes);
    };
    
    GeneticAlgorithm.numberOfGenerations = 100;
    GeneticAlgorithm.sdError = 0;
    GeneticAlgorithm.populationSize = 50;
    GeneticAlgorithm.crossoverRate = 0.6;
    GeneticAlgorithm.mutationRate = 0.01;
    GeneticAlgorithm.elitismRatio = 0.2;
    GeneticAlgorithm.mutatedInitializationSize = 0;
    GeneticAlgorithm.randomInitializationSize = 0;
    
    /////////////////////////////
    //  Class Declaration
    /////////////////////////////
    pslg.FitnessSort = FitnessSort;
    pslg.GeneticAlgorithm = GeneticAlgorithm;
}());
