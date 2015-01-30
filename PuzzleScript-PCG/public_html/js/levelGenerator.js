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
        this.randomnessPercentage = array[2];
        this.winCondWeight = array[3];
        this.criticalWeight = array[4];
        this.ruleWeight = array[5];
    }
    
    LGFeatures.prototype.ConvertToArray = function(){
        return [this.coverPercentage, this.playerNumber, this.randomnessPercentage, this.winCondWeight, this.criticalWeight, this.ruleWeight];
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
                
                values.push(currentValue);
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
                else if(currentValue === bestValue){
                    var randomNumber = Math.random();
                    if(randomNumber < 0.5){
                        bestIndex = i;
                    }
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
        var criticalNumber = 0;
        var ruleNumber = 0;
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
                    ruleObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
                    ruleNumber += ruleAnalyzer.minNumberObjects[obj];
                    break;
                case 2:
                    ruleObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
                    ruleNumber += ruleAnalyzer.minNumberObjects[obj];
                    break;
                case 3:
                    criticalObjects[obj] = ruleAnalyzer.minNumberObjects[obj];
                    criticalNumber += ruleAnalyzer.minNumberObjects[obj];
                    break;
            }
        }
        
        var _level = deepCloneLevel(LevelGenerator.levelsOutline[dl]);
        
        var playerNumber = ruleAnalyzer.minNumberObjects["player"] * this.lgFeatures.playerNumber;
        var winNumber = ruleAnalyzer.minNumberObjects[ruleAnalyzer.winObjects[0]] + ruleAnalyzer.minNumberObjects[ruleAnalyzer.winObjects[1]];
        if(ruleAnalyzer.winObjects.indexOf("player") > -1){
            winNumber = 2 * playerNumber;
            playerNumber = 0;
        }
        var solidNumber = ruleAnalyzer.solidObjects.length;
        var totalNumber = criticalNumber + ruleNumber + solidNumber + winNumber;
        
        var emptySpaces = LevelGenerator.emptySpaces[dl].clone().shuffle();
        var nObjects = this.lgFeatures.coverPercentage * emptySpaces.length - playerNumber;
        
        if(playerNumber > 0){
            winNumber = (winNumber / totalNumber) * nObjects * this.lgFeatures.winCondWeight * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        }
        criticalNumber = (criticalNumber / totalNumber) * nObjects * this.lgFeatures.criticalWeight * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        ruleNumber = (ruleNumber / totalNumber) * nObjects * this.lgFeatures.ruleWeight * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        solidNumber = (solidNumber / totalNumber) * nObjects * (1 - this.lgFeatures.ruleWeight - this.lgFeatures.criticalWeight - this.lgFeatures.winCondWeight);
        if(solidNumber > nObjects - ruleNumber - winNumber - criticalNumber){
            solidNumber = nObjects - ruleNumber - winNumber - criticalNumber;
        }
        
        var objectNumber = 0;
        var minObjects = 0;
        
        // Adding player to the play ground
        var obj1LayerMask = state.layerMasks[state.objects["player"].layer];
        while(playerNumber > 0){
            var index = this.GetInsertionLocation(ruleAnalyzer, "player", obj1LayerMask, _level, emptySpaces);
            var position = emptySpaces[index];
            emptySpaces.splice(index, 1);
            _level.dat[position] = _level.dat[position] | state.objectMasks["player"];
            playerNumber -= 1;
        }
        
        // Adding winning condition objects
        var obj1 = ruleAnalyzer.winObjects[0];
        var obj2 = ruleAnalyzer.winObjects[1];
        var obj1LayerMask = state.layerMasks[state.objects[obj1].layer];
        var obj2LayerMask = state.layerMasks[state.objects[obj2].layer];
        minObjects = Math.max(ruleAnalyzer.minNumberObjects[obj1], ruleAnalyzer.minNumberObjects[obj2]);
        while(winNumber > 0){
            for (var j = 0; j < minObjects; j++){
                var index = this.GetInsertionLocation(ruleAnalyzer, obj1, obj1LayerMask, _level, emptySpaces);
                var position = emptySpaces[index];
                emptySpaces.splice(index, 1);
                _level.dat[position] = _level.dat[position] | state.objectMasks[obj1];
                winNumber -= 1;
                
                if(ruleAnalyzer.winRules[i] === "no"){
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj2];
                    winNumber -= 1;   
                }
                else{
                    index = this.GetInsertionLocation(ruleAnalyzer, obj2, obj2LayerMask, _level, emptySpaces);
                    position = emptySpaces[index];
                    emptySpaces.splice(index, 1);
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj2];
                    winNumber -= 1;
                }
            }
        }
        
        //deleting win objects and players so as not to generate them again
        delete criticalObjects[obj1];
        delete criticalObjects[obj2];
        delete criticalObjects["player"];
        delete ruleObjects[obj1];
        delete ruleObjects[obj2];
        delete ruleObjects["player"];
        
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
            objectNumber = criticalObjects[obj];
            
            for (var j = 0; j < objectNumber; j++){
                var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
                var position = emptySpaces[index];
                emptySpaces.splice(index, 1);
                _level.dat[position] = _level.dat[position] | state.objectMasks[obj];
            }

            if(objectNumber === 0){
                objectNumber = 1;
            }
            criticalNumber -= objectNumber;
        }
        
        //Generate Rest of critical objects
        while(criticalNumber > 0){
            randomValue = Math.random();
            var obj;
            for (obj in criticalPropability){
                minObjects = criticalObjects[obj];
                if(randomValue < criticalPropability[obj]){
                    objectNumber = minObjects;
                    break;
                }
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
            criticalNumber -= objectNumber;
        }
        
        //Generating Rule Objects
        while(ruleNumber > 0){
            randomValue = Math.random();
            var obj;
            for (obj in rulePropability){
                minObjects = ruleObjects[obj];
                if(randomValue < rulePropability[obj]){
                    objectNumber = minObjects;
                    break;
                }
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
            ruleNumber -= objectNumber;
        }
        
        // Generate solid Objects
        while(solidNumber > 0){
            var obj = ruleAnalyzer.solidObjects.rand();
            
            var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
            var position = emptySpaces[index];
            emptySpaces.splice(index, 1);
            _level.dat[position] = _level.dat[position] | state.objectMasks[obj];

            solidNumber -= 1;
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
