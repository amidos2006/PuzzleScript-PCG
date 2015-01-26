/* 
 * Level Generator
 * Author: Ahmed Abdel Samea Khalifa
 * 
 * This contains methods to analyze the current selected rules
 */

this.pslg = this.pslg||{};

(function()
{
    function LGFeatures(array){
        this.coverPercentage = array[0];
        this.playerNumber = array[1];
        this.objectIncPercentage = array[2];
        this.randomnessPercentage = array[3];
        this.criticalWeight = array[4];
        this.ruleWeight = array[5];
    }
    
    LGFeatures.prototype.ConvertToArray = function(){
        return [this.coverPercentage, this.playerNumber, this.objectIncPercentage, this.randomnessPercentage, this.criticalWeight, this.ruleWeight];
    };
    
    function LevelGenerator(lgFeatures){
        this.lgFeatures = lgFeatures;
    }
    
    LevelGenerator.numberOfLevelsPerDifficulty = 3;
    LevelGenerator.moreStrict = false;
    LevelGenerator.levelsOutline = [];
    
    LevelGenerator.Initialize = function(objectMasks){
        LevelGenerator.emptySpaces = [];
        for(var l = 0; l < LevelGenerator.levelsOutline.length; l++){
            LevelGenerator.emptySpaces.push([]);
            for(var i = 0; i < LevelGenerator.levelsOutline[l].dat.length; i++){
                var result = LevelGenerator.levelsOutline[l].dat[i] & objectMasks["#"];
                if(result === 0){
                    LevelGenerator.emptySpaces[l].push(i);
                }
            }
        }
    };
    
    LevelGenerator.prototype.GetObjectNumber = function(dl, minObjects){
        var objIncrease = this.lgFeatures.objectIncPercentage * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        return Math.floor(dl * objIncrease) * minObjects  + minObjects;
    };
    
    LevelGenerator.prototype.TestInsertionLocation = function(ruleAnalyzer, obj, layerMask, level, emptySpaces){
        var values = [];
        for (var i = 0; i < emptySpaces.length; i++) {
            var result = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.GetMovingMask();
            var currentValue = 0;
            if(result > 0){
                var right = level.dat[emptySpaces[i] + 1] & layerMask;
                var left = level.dat[emptySpaces[i] - 1] & layerMask;
                var up = level.dat[emptySpaces[i] - level.w] & layerMask;
                var down = level.dat[emptySpaces[i] + level.w] & layerMask;
                
                var upLeft = level.dat[emptySpaces[i] - level.w - 1] & layerMask;
                var upRight = level.dat[emptySpaces[i] - level.w + 1] & layerMask;
                var downLeft = level.dat[emptySpaces[i] + level.w - 1] & layerMask;
                var downRight = level.dat[emptySpaces[i] + level.w + 1] & layerMask;
                
                currentValue = right > 0? currentValue + 1 : currentValue;
                currentValue = left > 0? currentValue + 1 : currentValue;
                currentValue = up > 0? currentValue + 1 : currentValue;
                currentValue = down > 0? currentValue + 1 : currentValue;
                
                if(LevelGenerator.moreStrict){
                    currentValue = upLeft > 0? currentValue + 1 : currentValue;
                    currentValue = upRight > 0? currentValue + 1 : currentValue;
                    currentValue = downLeft > 0? currentValue + 1 : currentValue;
                    currentValue = downRight > 0? currentValue + 1 : currentValue;
                }
                
                values.push(currentValue)
            }
            else{
                break;
            }
        }
        
        return values;
    };
    
    LevelGenerator.prototype.GetInsertionLocation = function(ruleAnalyzer, obj, layerMask, level, emptySpaces){
        var bestIndex = -1;
        var bestValue = 10;
        for (var i = 0; i < emptySpaces.length; i++) {
            var result = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.GetMovingMask();
            var currentValue = 0;
            if(result > 0){
                var right = level.dat[emptySpaces[i] + 1] & layerMask;
                var left = level.dat[emptySpaces[i] - 1] & layerMask;
                var up = level.dat[emptySpaces[i] - level.h] & layerMask;
                var down = level.dat[emptySpaces[i] + level.h] & layerMask;
                
                var upLeft = level.dat[emptySpaces[i] - level.h - 1] & layerMask;
                var upRight = level.dat[emptySpaces[i] - level.h + 1] & layerMask;
                var downLeft = level.dat[emptySpaces[i] + level.h - 1] & layerMask;
                var downRight = level.dat[emptySpaces[i] + level.h + 1] & layerMask;
                
                currentValue = right > 0? currentValue + 1 : currentValue;
                currentValue = left > 0? currentValue + 1 : currentValue;
                currentValue = up > 0? currentValue + 1 : currentValue;
                currentValue = down > 0? currentValue + 1 : currentValue;
                
                if(LevelGenerator.moreStrict){
                    currentValue = upLeft > 0? currentValue + 1 : currentValue;
                    currentValue = upRight > 0? currentValue + 1 : currentValue;
                    currentValue = downLeft > 0? currentValue + 1 : currentValue;
                    currentValue = downRight > 0? currentValue + 1 : currentValue;
                }
                
                if(currentValue < bestValue){
                    bestIndex = i;
                    bestValue = currentValue;
                }
            }
            else{
                break;
            }
        }
        
        if(bestIndex < 0){
            bestIndex = 0;
        }
        
        return bestIndex;
    };
    
    LevelGenerator.prototype.GenerateLevel = function(dl, ruleAnalyzer, state){
        this.winRule = ruleAnalyzer.winRules[0];
        
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
        
        var _level = deepCloneLevel(LevelGenerator.levelsOutline[dl]);
        
        var criticalNumber = Object.keys(criticalObjects).length * this.lgFeatures.criticalWeight;
        var ruleNumber = Object.keys(ruleObjects).length * this.lgFeatures.ruleWeight;
        var solidNumber = ruleAnalyzer.solidObjects.length * (1 - this.lgFeatures.criticalWeight - this.lgFeatures.ruleWeight);
        var totalNumber = criticalNumber + ruleNumber + solidNumber;
        
        var emptySpaces = LevelGenerator.emptySpaces[dl].clone().shuffle();
        var nObjects = this.lgFeatures.coverPercentage * emptySpaces.length;
        var objectNumber = 0;
        var minObjects = 0;
        
        // Adding winning condition objects
        for(var i = 0; i < ruleAnalyzer.winRules.length; i++){
            var obj1 = ruleAnalyzer.winObjects[2*i];
            var obj2 = ruleAnalyzer.winObjects[2*i + 1];
            var obj1LayerMask = state.layerMasks[state.objects[obj1].layer];
            var obj2LayerMask = state.layerMasks[state.objects[obj2].layer];
            minObjects = Math.max(ruleAnalyzer.minNumberObjects[obj1], ruleAnalyzer.minNumberObjects[obj2]);
            switch(ruleAnalyzer.winRules[i]){
                case "no":
                    objectNumber = this.GetObjectNumber(dl, minObjects);
                    break;
                case "some":
                    objectNumber = this.GetObjectNumber(10 - dl, minObjects);
                    break;
                case "all":
                    objectNumber = this.GetObjectNumber(dl, minObjects);;
                    break;
            }
            
            if((obj1 === "player" || obj2 === "player") && this.lgFeatures.playerNumber > 0){
                objectNumber = this.lgFeatures.playerNumber;
            }
            else{
                while(objectNumber > nObjects && objectNumber - minObjects > 0){
                    objectNumber -= minObjects;
                }
            }
            for (var j = 0; j < objectNumber; j++){
                var index = this.GetInsertionLocation(ruleAnalyzer, obj1, obj1LayerMask, _level, emptySpaces);
                var position = emptySpaces[index];
                var isCreated = ruleAnalyzer.objectBehaviour[obj1] & pslg.ObjectBehaviour.CREATE;
                if(isCreated === 0){
                    emptySpaces.splice(index, 1);
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj1];
                    nObjects -= 1;
                }
                var isCreated = ruleAnalyzer.objectBehaviour[obj2] & pslg.ObjectBehaviour.CREATE;
                if(isCreated === 0){
                    if(ruleAnalyzer.winRules[i] === "no"){
                        isCreated = ruleAnalyzer.objectBehaviour[obj2] & pslg.ObjectBehaviour.CREATE;
                        if(isCreated === 0){
                            _level.dat[position] = _level.dat[position] | state.objectMasks[obj2];
                            nObjects -= 1;
                        }
                    }
                    else{
                        index = this.GetInsertionLocation(ruleAnalyzer, obj2, obj2LayerMask, _level, emptySpaces);
                        position = emptySpaces[index];
                        isCreated = ruleAnalyzer.objectBehaviour[obj2] & pslg.ObjectBehaviour.CREATE;
                        if(isCreated === 0){
                            emptySpaces.splice(index, 1);
                            _level.dat[position] = _level.dat[position] | state.objectMasks[obj2];
                            nObjects -= 1;
                        }
                    }
                }
            }
            delete criticalObjects[obj1];
            delete criticalObjects[obj2];
            delete ruleObjects[obj1];
            delete ruleObjects[obj2];
        }
        
        var noMorePlayer = false;
        
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
        
        // Adding at least 1 critical path elements
        for (var obj in criticalObjects){
            minObjects = criticalObjects[obj];
            objectNumber = this.GetObjectNumber(dl, minObjects);
            if(obj === "player" && this.lgFeatures.playerNumber > 0){
                if(noMorePlayer){
                    objectNumber = 0;
                }
                else{
                    objectNumber = this.lgFeatures.playerNumber;
                    noMorePlayer = true;
                }
            }
            var isCreated = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.CREATE;
            if(isCreated !== 0){
                objectNumber = 0;
            }
            
            while(objectNumber > nObjects && objectNumber - minObjects > 0){
                objectNumber -= minObjects;
            }
            
            for (var j = 0; j < objectNumber; j++){
                var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
                var position = emptySpaces[index];
                emptySpaces.splice(index, 1);
                _level.dat[position] = _level.dat[position] | state.objectMasks[obj];
            }

            if(objectNumber === 0){
                objectNumber = 1;
            }
            nObjects -= objectNumber;
        }

        //console.log("level: " + _level.dat.toString() + ", with Difficult: " + dl.toString() + ", with nObjects: " + nObjects.toString());
        // Generate the rest of the objects in the scene
        while(nObjects > 0){
            var randomValue = Math.random();
            //console.log("random: " + randomValue.toFixed(2) + ", criticalNumber: " + criticalNumber.toFixed(2));
            if(randomValue < criticalNumber / totalNumber){
                randomValue = Math.random();
                var obj;
                for (obj in criticalPropability){
                    if(randomValue < criticalPropability[obj]){
                        minObjects = criticalObjects[obj];
                        objectNumber = this.GetObjectNumber(dl, minObjects);
                        if(obj === "player" && this.lgFeatures.playerNumber > 0){
                            if(noMorePlayer){
                                objectNumber = 0;
                            }
                            else{
                                objectNumber = this.lgFeatures.playerNumber;
                                noMorePlayer = true;
                            }
                        }
                        break;
                    }
                }
                
                var isCreated = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.CREATE;
                if(isCreated !== 0){
                    objectNumber = 0;
                }
                
                while(objectNumber > nObjects && objectNumber - minObjects > 0){
                    objectNumber -= minObjects;
                }
                
                for (var j = 0; j < objectNumber; j++){
                    var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
                    var position = emptySpaces[index];
                    emptySpaces.splice(index, 1);
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj];
                }

                if(objectNumber === 0){
                    objectNumber = 1;
                }
                nObjects -= objectNumber;
            }
            else if(randomValue < (criticalNumber + ruleNumber) / totalNumber){
                randomValue = Math.random();
                var obj;
                for (obj in rulePropability){
                    if(randomValue < rulePropability[obj]){
                        minObjects = ruleObjects[obj];
                        objectNumber = this.GetObjectNumber(dl, minObjects);
                        if(obj === "player" && this.lgFeatures.playerNumber > 0){
                            if(noMorePlayer){
                                objectNumber = 0;
                            }
                            else{
                                objectNumber = this.lgFeatures.playerNumber;
                                noMorePlayer = true;
                            }
                        }
                        break;
                    }
                }
                
                var isCreated = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.CREATE;
                if(isCreated !== 0){
                    objectNumber = 0;
                }
                
                while(objectNumber > nObjects && objectNumber - minObjects > 0){
                    objectNumber -= minObjects;
                }
                
                for (var j = 0; j < objectNumber; j++){
                    var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
                    var position = emptySpaces[index];
                    emptySpaces.splice(index, 1);
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj];
                }

                if(objectNumber === 0){
                    objectNumber = 1;
                }
                nObjects -= objectNumber;
            }
            else{
                var obj = ruleAnalyzer.solidObjects.rand();
                minObjects = 1;
                objectNumber = this.GetObjectNumber(dl, minObjects);
                
                var isCreated = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.CREATE;
                if(isCreated !== 0){
                    objectNumber = 0;
                }
                
                while(objectNumber > nObjects && objectNumber - minObjects > 0){
                    objectNumber -= minObjects;
                }
                
                for (var j = 0; j < objectNumber; j++){
                    var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
                    var position = emptySpaces[index];
                    emptySpaces.splice(index, 1);
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj];
                }

                if(objectNumber === 0){
                    objectNumber = 1;
                }
                nObjects -= objectNumber;
            }
        }
        
        return _level;
    };
    
    LevelGenerator.prototype.GenerateLevels = function(ruleAnalyzer, state){
        var _levels = [];
        for (var l = 0; l < LevelGenerator.levelsOutline.length * LevelGenerator.numberOfLevelsPerDifficulty; l++){
            var dl = Math.floor( l / LevelGenerator.numberOfLevelsPerDifficulty);
            _levels.push(this.GenerateLevel(dl, ruleAnalyzer, state));
        }
        
        return _levels;
    };  
    
    /////////////////////////////
    //  Class Declaration
    /////////////////////////////
    pslg.LGFeatures = LGFeatures;
    pslg.LevelGenerator = LevelGenerator;
}());
