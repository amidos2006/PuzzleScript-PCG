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
    
    LevelGenerator.AutoFeatures = function(ruleAnalyzer){
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
                    ruleNumber += ruleAnalyzer.minNumberObjects[obj];
                    break;
                case 2:
                    ruleNumber += ruleAnalyzer.minNumberObjects[obj];
                    break;
                case 3:
                    criticalNumber += ruleAnalyzer.minNumberObjects[obj];
                    break;
            }
        }
        
        var playerNumber = ruleAnalyzer.minNumberObjects["player"];
        var winNumber = ruleAnalyzer.minNumberObjects[ruleAnalyzer.winObjects[0]] + ruleAnalyzer.minNumberObjects[ruleAnalyzer.winObjects[1]];
        if(ruleAnalyzer.winObjects.indexOf("player") > -1){
            winNumber = 2 * playerNumber;
        }
        else if(ruleAnalyzer.winRules[0] === "some"){
            winNumber = Math.max(ruleAnalyzer.minNumberObjects[ruleAnalyzer.winObjects[0]], ruleAnalyzer.minNumberObjects[ruleAnalyzer.winObjects[1]]);
        }
        var solidNumber = ruleAnalyzer.solidObjects.length;
        var totalNumber = solidNumber + winNumber + criticalNumber + ruleNumber;
        var density = 1 - (winNumber + criticalNumber) / totalNumber;
        
        winNumber *= 2;
        criticalNumber *= 2;
        ruleNumber *= 1.5;
        solidNumber *= 1;
        totalNumber = winNumber + criticalNumber + ruleNumber + solidNumber;
        
        winNumber /= totalNumber;
        criticalNumber /= totalNumber;
        ruleNumber /= totalNumber;
        solidNumber /= totalNumber;
        
        return new LGFeatures([density.toPrecision(5), playerNumber, 
            (0.2 * Math.random()).toPrecision(5), 
            winNumber.toPrecision(5), 
            criticalNumber.toPrecision(5), 
            ruleNumber.toPrecision(5)]);
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
    
    LevelGenerator.prototype.GetInsertionLocations = function(ruleAnalyzer, obj, layerMask, level, emptySpaces){
        var locations = [];
        for (var i = 0; i < 16; i++) {
            locations.push([]);
        }
        
        for (var i = 0; i < emptySpaces.length; i++) {
            var result = ruleAnalyzer.objectBehaviour[obj] & pslg.ObjectBehaviour.GetMovingMask();
            var currentValue = 0;
            if(result > 0){
                var right = level.dat[emptySpaces[i] + 1] & layerMask;
                var left = level.dat[emptySpaces[i] - 1] & layerMask;
                var up = level.dat[emptySpaces[i] - level.h] & layerMask;
                var down = level.dat[emptySpaces[i] + level.h] & layerMask;
                
                var leftSide = emptySpaces[i] / level.h < 2;
                var rightSide = emptySpaces[i] / level.h >= level.w - 2;
                var downSide = emptySpaces[i] % level.h >= level.h - 2;
                var upSide = emptySpaces[i] % level.h < 2;
                
                currentValue = right > 0? currentValue + 2 : currentValue;
                currentValue = left > 0? currentValue + 2 : currentValue;
                currentValue = up > 0? currentValue + 2 : currentValue;
                currentValue = down > 0? currentValue + 2 : currentValue;
                
                if(LevelGenerator.moreStrict){
                    currentValue = leftSide? currentValue + 1 : currentValue;
                    currentValue = rightSide? currentValue + 1 : currentValue;
                    currentValue = downSide? currentValue + 1 : currentValue;
                    currentValue = upSide? currentValue + 1 : currentValue;
                }
                
                locations[currentValue].push(i);
            }
            else{
                locations[0].push(i);
            }
        }
        
        return locations;
    };
    
    LevelGenerator.prototype.GetInsertionLocation = function(ruleAnalyzer, obj, layerMask, level, emptySpaces){
        var locations = this.GetInsertionLocations(ruleAnalyzer, obj, layerMask, level, emptySpaces);
        
        for (var i = 0; i < locations.length; i++) {
            if(locations[i].length > 0){
                return locations[i][Math.randomInt(locations[i].length)];
            }
        }
        
        return 0;
    };
    
    LevelGenerator.prototype.GetFarthestInsertionLocation = function(ruleAnalyzer, obj, layerMask, level, emptySpaces, pos){
        var locations = this.GetInsertionLocations(ruleAnalyzer, obj, layerMask, level, emptySpaces);
        var p1 = Math.getPoint(pos, level.h);
        var currentValue = 0;
        for (var i = 0; i < locations.length; i++) {
            if(locations[i].length > 0){
                currentValue = i;
                break;
            }
        }
        
        var bestIndex = 0;
        var bestValue = -1;
        for (var i = 0; i < locations[currentValue].length; i++) {
            var p2 = Math.getPoint(emptySpaces[locations[currentValue][i]], level.h);
            var dist = get_manhattan_distance(p1.x, p1.y, p2.x, p2.y) + Math.randomInt(3);
            if(dist > bestValue){
                bestValue = dist;
                bestIndex = i;
            }
        }
        
        return bestIndex;
    };
    
    LevelGenerator.prototype.GenerateLevel = function(dl, ruleAnalyzer, state){
        this.winRule = ruleAnalyzer.winRules[0];
        
        var criticalObjects = {};
        var ruleObjects = {};
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
        
        var playerNumber = ruleAnalyzer.minNumberObjects["player"] * this.lgFeatures.playerNumber;
        var winNumber = 0;
        if(ruleAnalyzer.winObjects.indexOf("player") > -1){
            winNumber = 2 * playerNumber;
            playerNumber = 0;
        }
        else if(this.winRule === "some"){
            var obj1 = ruleAnalyzer.winObjects[0];
            var obj2 = ruleAnalyzer.winObjects[1]; 
            winNumber = Math.max(ruleAnalyzer.minNumberObjects[obj1], ruleAnalyzer.minNumberObjects[obj2]);
        }
        
        var emptySpaces = LevelGenerator.emptySpaces[dl].clone().shuffle();
        var nObjects = this.lgFeatures.coverPercentage * emptySpaces.length - playerNumber;
        
        if(winNumber === 0){
            winNumber = nObjects * this.lgFeatures.winCondWeight * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        }
        var criticalNumber = nObjects * this.lgFeatures.criticalWeight * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        var ruleNumber = nObjects * this.lgFeatures.ruleWeight * (1 - (Math.random() - 0.5) * this.lgFeatures.randomnessPercentage);
        var solidNumber = nObjects * (1 - this.lgFeatures.ruleWeight - this.lgFeatures.criticalWeight - this.lgFeatures.winCondWeight);
        if(solidNumber > nObjects - ruleNumber - winNumber - criticalNumber){
            solidNumber = nObjects - ruleNumber - winNumber - criticalNumber;
        }
        
        var objectNumber = 0;
        var minObjects = 0;
        
        // Generate solid Objects
        while(solidNumber > 0){
            var obj = ruleAnalyzer.solidObjects.rand();
            
            if(!state.objects.hasOwnProperty(obj))
            {
                throw "Error happened because of " + obj + " and the solidObjects length is " + ruleAnalyzer.solidObjects.length + " and the objects length is " + Object.keys(state.objects).length.toString();
            }
            
            var index = this.GetInsertionLocation(ruleAnalyzer, obj, state.layerMasks[state.objects[obj].layer], _level, emptySpaces);
            var position = emptySpaces[index];
            emptySpaces.splice(index, 1);
            _level.dat[position] = _level.dat[position] | state.objectMasks[obj];

            solidNumber -= 1;
        }
        
        objectNumber = 0;
        minObjects = 0;
        
        // Adding winning condition objects
        var obj1 = ruleAnalyzer.winObjects[0];
        var obj2 = ruleAnalyzer.winObjects[1];
        //Make sure the moving object is the first to be placed while static one is the second
        var result = ruleAnalyzer.objectBehaviour[obj1] & pslg.ObjectBehaviour.GetMovingMask();
        if(result === 0){
            obj1 = ruleAnalyzer.winObjects[1];
            obj2 = ruleAnalyzer.winObjects[0];
        }
        //Make sure neither any of the output have creation pattern
        result = ruleAnalyzer.objectBehaviour[obj1] & pslg.ObjectBehaviour.CREATE;
        if(result !== 0){
            var temp = obj1;
            obj1 = obj2;
            obj2 = temp;
        }
        var obj1LayerMask = state.layerMasks[state.objects[obj1].layer];
        var obj2LayerMask = state.layerMasks[state.objects[obj2].layer];
        minObjects = Math.max(ruleAnalyzer.minNumberObjects[obj1], ruleAnalyzer.minNumberObjects[obj2]);
        result = ruleAnalyzer.objectBehaviour[obj2] & pslg.ObjectBehaviour.CREATE;
        while(winNumber > 0){
            var secondObjectNumber = ruleAnalyzer.minNumberObjects[obj2];
            for (var j = 0; j < minObjects; j++){
                var index = this.GetInsertionLocation(ruleAnalyzer, obj1, obj1LayerMask, _level, emptySpaces);
                var position = emptySpaces[index];
                emptySpaces.splice(index, 1);
                _level.dat[position] = _level.dat[position] | state.objectMasks[obj1];
                winNumber -= 1;
                
                if(result > 0 && secondObjectNumber <= 0){
                    continue;
                }
                else{
                    secondObjectNumber -= 1;
                }
                
                if(this.winRule === "no"){
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj2];
                    winNumber -= 1;   
                }
                else{
                    index = this.GetFarthestInsertionLocation(ruleAnalyzer, obj2, obj2LayerMask, _level, emptySpaces, position);
                    position = emptySpaces[index];
                    emptySpaces.splice(index, 1);
                    _level.dat[position] = _level.dat[position] | state.objectMasks[obj2];
                    winNumber -= 1;
                }
            }
        }
        
        objectNumber = 0;
        minObjects = 0;
        
        // Adding player to the play ground
        var obj1LayerMask = state.layerMasks[state.objects["player"].layer];
        while(playerNumber > 0){
            var index = this.GetInsertionLocation(ruleAnalyzer, "player", obj1LayerMask, _level, emptySpaces);
            var position = emptySpaces[index];
            emptySpaces.splice(index, 1);
            _level.dat[position] = _level.dat[position] | state.objectMasks["player"];
            playerNumber -= 1;
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
        
        objectNumber = 0;
        minObjects = 0;
        
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
            objectNumber = 0;
            minObjects = 0;
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
            objectNumber = 0;
            minObjects = 0;
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
