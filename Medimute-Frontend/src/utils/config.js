const predictedClassNames = [
    "HELLO SUYASH",
    "OPEN",
    "CLOSE",
    "SUYASH GAY",
]

export function getPredictedDisease(predictedClass) {
    if(predictedClass === null) {
        return predictedClassNames[0];
    }

    return predictedClassNames[predictedClass + 1];
}