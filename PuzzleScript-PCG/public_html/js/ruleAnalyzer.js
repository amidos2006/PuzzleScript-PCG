/* 
 * Rule Analyzer
 * Author: Ahmed Abdel Samea Khalifa
 * 
 * This contains methods to analyze the current selected rules
 */

this.pslg = this.pslg||{};

(function()
{
    /////////////////////////////
    //  Object Behaviour
    /////////////////////////////
    var ObjectBehaviour = {
      CREATE : 1,
      DESTROY : 2,
      MOVE_SAME : 4,
      MOVE_DIFF : 8,
      MOVE_TELEPORT: 16
    };
    
    ObjectBehaviour.GetMovingMask = function(){
        return ObjectBehaviour.MOVE_SAME | ObjectBehaviour.MOVE_DIFF;
    };
    
    /////////////////////////////
    //  Class Rule Analyzer
    /////////////////////////////
    function RuleAnalyzer() {
        this.ruleObjects = [];
        this.winObjects = [];
        this.solidObjects = [];
        this.winRules = [];
        this.minNumberObjects = {};
        this.objectBehaviour = {};
        this.objectPriority = {};
        this.dependencyMatrix = {};
    }
    
    RuleAnalyzer.movingCommands = {};
    RuleAnalyzer.movingCommands["up"] = true;
    RuleAnalyzer.movingCommands["down"] = true;
    RuleAnalyzer.movingCommands["left"] = true;
    RuleAnalyzer.movingCommands["right"] = true;
    RuleAnalyzer.movingCommands["moving"] = true;
    RuleAnalyzer.movingCommands["randomdir"] = true;
    RuleAnalyzer.movingCommands["<"] = true;
    RuleAnalyzer.movingCommands[">"] = true;
    RuleAnalyzer.movingCommands["v"] = true;
    RuleAnalyzer.movingCommands["^"] = true;
    
    RuleAnalyzer.prototype.Initialize = function(engineState) {
        var i, j, k;
        
        //Check the win condition rule
        for(i = 0; i < engineState.originalWinConditions.length; i++){
            var winCond = engineState.originalWinConditions[i];
            if(winCond.length > 3){
                this.minNumberObjects[winCond[3]] = 1;
                
                if(this.dependencyMatrix[winCond[1]] === undefined){
                    this.dependencyMatrix[winCond[1]] = {};
                }
                if(this.dependencyMatrix[winCond[1]][winCond[3]] === undefined){
                    this.dependencyMatrix[winCond[1]][winCond[3]] = 1;
                }
                else{
                    this.dependencyMatrix[winCond[1]][winCond[3]] += 1;
                }
                
                if(this.dependencyMatrix[winCond[3]] === undefined){
                    this.dependencyMatrix[winCond[3]] = {};
                }
                if(this.dependencyMatrix[winCond[3]][winCond[1]] === undefined){
                    this.dependencyMatrix[winCond[3]][winCond[1]] = 1;
                }
                else{
                    this.dependencyMatrix[winCond[3]][winCond[1]] += 1;
                }
                
                if(this.objectPriority[winCond[3]] === undefined){
                    this.objectPriority[winCond[3]] = 1;
                }
                else{
                    this.objectPriority[winCond[3]] += 1;
                }
                
                if(this.winObjects.indexOf(winCond[3]) < 0){
                    this.winObjects.push(winCond[3]);
                }
            }
            
            if(this.winObjects.indexOf(winCond[1]) < 0){
                this.winObjects.push(winCond[1]);
            }
            
            if(this.winRules.indexOf(winCond[0]) < 0){
                this.winRules.push(winCond[0]);
            }
            
            if(this.objectPriority[winCond[1]] === undefined){
                this.objectPriority[winCond[1]] = 1;
            }
            else{
                this.objectPriority[winCond[1]] += 1;
            }
            
            this.minNumberObjects[winCond[1]] = 1;
        }
        
        //Check the original rules
        for(i = 0; i < engineState.originalRules.length; i++){
            var rule = engineState.originalRules[i];
            var lhs = rule.lhs;
            var rhs = rule.rhs;
            var numberLHS = {};
            var numberRHS = {};
            var dependObj = [];
            var moveObj = [];
            
            // Calculating variables for each rule
            for(j = 0; j < lhs.length; j++){
                var lTuple = lhs[j];
                var rTuple = rhs[j];
                for(k = 0; k < lTuple.length; k++){
                    var lObj = lTuple[k];
                    var rObj = rTuple[k];
                    
                    for (var l = 0; l < lObj.length; l+= 2){
                        if(lObj[l + 1] !== undefined && lObj[l] !== "no"){
                            if(this.ruleObjects.indexOf(lObj[l + 1]) < 0){
                                this.ruleObjects.push(lObj[l + 1]);
                            }

                            if(dependObj.indexOf(lObj[l + 1]) < 0){
                                dependObj.push(lObj[l + 1]);
                            }

                            if(lObj[l + 1] in numberLHS){
                                numberLHS[lObj[l + 1]] += 1;
                            }
                            else{
                                numberLHS[lObj[l + 1]] = 1;
                            }
                        }
                    }
                    
                    for (var l = 0; l < rObj.length; l+= 2){
                        if(rObj[l + 1] !== undefined && rObj[l] !== "no"){
                            if(this.ruleObjects.indexOf(rObj[l + 1]) < 0){
                                this.ruleObjects.push(rObj[l + 1]);
                            }

                            if(dependObj.indexOf(rObj[l + 1]) < 0){
                                dependObj.push(rObj[l + 1]);
                            }

                            if(rObj[l + 1] in numberRHS){
                                numberRHS[rObj[l + 1]] += 1;
                            }
                            else{
                                numberRHS[rObj[l + 1]] = 1;
                            }
                        }
                    }
                    
                    for (var l = 0; l < lObj.length; l+= 2){
                        if(lObj[l + 1] !== undefined && lObj[l + 1] === rObj[l + 1] && !(lObj[l] === "no" || rObj[l] ==="no")){
                            if(pslg.RuleAnalyzer.movingCommands[lObj[l]] === undefined && 
                                pslg.RuleAnalyzer.movingCommands[rObj[l]] !== undefined){
                                if(this.objectBehaviour[lObj[l + 1]] === undefined){
                                    this.objectBehaviour[lObj[l + 1]] = 0;
                                }
                                var same = true;
                                if(rObj[l] !== "moving"){
                                    if(rObj[l] === "randomdir"){
                                        same = false;
                                    }
                                    else{
                                        for(var t1 = 0; t1 < lTuple.length; t1++){
                                            var tObj = lTuple[t1];
                                            for (var t2 = 0; t2 < tObj.length; t2 += 2){
                                                if(pslg.RuleAnalyzer.movingCommands[tObj[t2]] !== undefined){
                                                    if(tObj[t2] !== rObj[l]){
                                                        same = false;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                if(same){
                                    this.objectBehaviour[lObj[l + 1]] |= pslg.ObjectBehaviour.MOVE_SAME;
                                }
                                else{
                                    this.objectBehaviour[lObj[l + 1]] |= pslg.ObjectBehaviour.MOVE_DIFF;
                                }
                            }
                            moveObj.push(lObj[l + 1]);
                        }
                    }
                }
            }
            
            // Calculating dependency Matrix
            for(j = 0; j < dependObj.length; j++){
                if(this.dependencyMatrix[dependObj[j]] === undefined){
                    this.dependencyMatrix[dependObj[j]] = {};
                }
                
                if(this.objectPriority[dependObj[j]] === undefined){
                    this.objectPriority[dependObj[j]] = 1;
                }
                else{
                    this.objectPriority[dependObj[j]] += 1;
                }
                
                for(k = 0; k < dependObj.length; k++){
                    if(this.dependencyMatrix[dependObj[j]][dependObj[k]] === undefined){
                        this.dependencyMatrix[dependObj[j]][dependObj[k]] = 1;
                    }
                    else{
                        this.dependencyMatrix[dependObj[j]][dependObj[k]] += 1;
                    }
                }
            }
            
            // Calculate the min number and behaviour
            var obj;
            for (obj in numberLHS){
                if(this.objectBehaviour[obj] === undefined){
                    this.objectBehaviour[obj] = 0;
                }
                
                if(this.minNumberObjects[obj] !== undefined){
                    this.minNumberObjects[obj] = Math.max(this.minNumberObjects[obj], numberLHS[obj]);
                }
                else{
                    this.minNumberObjects[obj] = numberLHS[obj];
                }

                if(numberRHS[obj] !== undefined){
                    if(numberLHS[obj] > numberRHS[obj]){
                        this.objectBehaviour[obj] |= pslg.ObjectBehaviour.DESTROY;
                    }
                    else if(numberLHS[obj] < numberRHS[obj]){
                        this.objectBehaviour[obj] |= pslg.ObjectBehaviour.CREATE;
                    }
                    else{
                        if(moveObj.indexOf(obj) < 0){
                            this.objectBehaviour[obj] |= pslg.ObjectBehaviour.MOVE_TELEPORT;
                        }
                    }
                }
                else{
                    this.objectBehaviour[obj] |= pslg.ObjectBehaviour.DESTROY;
                }
            }
            for (obj in numberRHS){
                if(this.objectBehaviour[obj] === undefined){
                    this.objectBehaviour[obj] = 0;
                }

                if(this.minNumberObjects[obj] !== undefined){
                    this.minNumberObjects[obj] = Math.max(this.minNumberObjects[obj], numberRHS[obj]);
                }
                else{
                    this.minNumberObjects[obj] = numberRHS[obj];
                }

                if(numberLHS[obj] !== undefined){
                    if(numberLHS[obj] > numberRHS[obj]){
                        this.objectBehaviour[obj] |= pslg.ObjectBehaviour.DESTROY;
                    }
                    else if(numberLHS[obj] < numberRHS[obj]){
                        this.objectBehaviour[obj] |= pslg.ObjectBehaviour.CREATE;
                    }
                    else{
                        if(moveObj.indexOf(obj) < 0){
                            this.objectBehaviour[obj] |= pslg.ObjectBehaviour.MOVE_TELEPORT;
                        }
                    }
                }
                else{
                    this.objectBehaviour[obj] |= pslg.ObjectBehaviour.CREATE;
                }
            }
        }
        
        //find solid objects
        for(i = 0; i < engineState.collisionLayers.length; i++){
            var layer = engineState.collisionLayers[i];
            var tempSolidObjects = [];
            var impLayer = false;
            
            for(j=0; j < layer.length; j++){
                var obj = layer[j];
                if(this.ruleObjects.indexOf(obj) < 0 && this.winObjects.indexOf(obj) < 0){
                    if(obj !== "background" && obj !== "player"){
                        tempSolidObjects.push(obj);
                    }
                }
                else{
                    impLayer = true;
                }
            }
            
            if(impLayer && tempSolidObjects.length > 0){
                this.solidObjects.push(tempSolidObjects[0]);
            }
        }
        
        //Modify the minimum values based on Object Behaviour
        for(var obj in this.minNumberObjects){
            var hasCreateRule = this.objectBehaviour[obj] & ObjectBehaviour.CREATE;
            if(hasCreateRule > 0){
                this.minNumberObjects[obj] = 1;
            }
        }
    };
    
    function Node(p, v){
        this.parent = p;
        this.value = v;
    }
    
    Node.prototype.GetPath = function(){
        if(this.parent === undefined){
            return [this.value];
        }
        
        var result = [];
        result = result.concat(this.parent.GetPath());
        result.push(this.value);
        return result;
    };
    
    RuleAnalyzer.prototype.CheckCriticalObject = function(startingObject){
        var graph = this.dependencyMatrix;
        var ending = this.winObjects;
        var processList = [new Node(undefined, startingObject)];
        var visitedNodes = {};
        var result = 0;
        
        if(startingObject === "player"){
            result = result | 1;
        }
        if(ending.indexOf(startingObject) >= 0){
            result = result | 2;
        }
        
        while(processList.length > 0 && result < 3){
            var currentNode = processList[0];
            processList.splice(0, 1);
            visitedNodes[currentNode.value] = true;
            for (var nextNodeValue in graph[currentNode.value]){
                if(graph[currentNode.value][nextNodeValue] > 0){
                    if(!visitedNodes.hasOwnProperty(nextNodeValue)){
                        visitedNodes[nextNodeValue] = true;
                        if(ending.indexOf(nextNodeValue) >= 0 || nextNodeValue === "player"){
                            if(nextNodeValue === "player"){
                                result = result | 1;
                            }
                            if(ending.indexOf(nextNodeValue) >= 0){
                                result = result | 2;
                            }
                        }
                        else{
                            processList.push(new Node(currentNode, nextNodeValue));
                        }
                    }
                }
            }
        }
        
        return result;
    };
    
    RuleAnalyzer.prototype.TraverseDependencyGraph = function(criticalPaths, otherPaths){
        var graph = this.dependencyMatrix;
        var ending = this.winObjects;
        var processList = [new Node(undefined, "player")];
        var resultList = [];
        var visitedNodes = {};
        while(processList.length > 0){
            var currentNode = processList[0];
            processList.splice(0, 1);
            visitedNodes[currentNode.value] = true;
            var hasChildren = false;
            for (var nextNodeValue in graph[currentNode.value]){
                if(graph[currentNode.value][nextNodeValue] > 0){
                    /*if(ending.indexOf(nextNodeValue) >= 0){
                        hasChildren = true;
                        var tempPath = currentNode.GetPath();
                        if(tempPath.indexOf(nextNodeValue) < 0){
                            resultList.push(new Node(currentNode, nextNodeValue));
                            currentNode = new Node(undefined, nextNodeValue);
                        }
                        else{
                            resultList.push(new Node(currentNode.parent, currentNode.value));
                        }
                    }*/
                    if(!visitedNodes.hasOwnProperty(nextNodeValue)){
                        hasChildren = true;
                        processList.push(new Node(currentNode, nextNodeValue));
                    }
                    else{
                        
                    }
                }
            }
            
            if(!hasChildren){
                resultList.push(currentNode);
            }
        }
        
        var _criticalPaths = [];
        var _otherPaths = [];
        for (var i = 0; i < resultList.length; i++){
            if(ending.indexOf(resultList[i].value) >= 0){
                _criticalPaths.push(resultList[i].GetPath());
            }
            else{
                _otherPaths.push(resultList[i].GetPath());
            }
        }
        
        $.each(_criticalPaths, function(i, el){
            if($.inArray(el, criticalPaths) === -1) criticalPaths.push(el);
        });
        
        $.each(_otherPaths, function(i, el){
            if($.inArray(el, otherPaths) === -1) otherPaths.push(el);
        });
    };
    
    /////////////////////////////
    //  Class Declaration
    /////////////////////////////
    pslg.ObjectBehaviour = ObjectBehaviour;
    pslg.RuleAnalyzer = RuleAnalyzer;
}());