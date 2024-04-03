const predictedClassInitialClass = null;

const reducer = (state = predictedClassInitialClass, action) => {
    console.log(action);
    switch(action.type) {
        case "set": {
            console.log("updated class: ", action.updatedPredictedClass);
            return action.updatedPredictedClass;
        }
        default: return state;
    }
}

export default reducer;