const predictedClassNames = [
    "No symptoms detected!!",
    "I am feeling like vomiting.",
    "I had an injury.",
    "I am having a headache.",
    "I am having loose motions",
    "I have high temperature of my body.",
    "I am having cough and my throat is aching.",
    "Not a registered gesture!!.",
    "Not a registered gesture!!."
]

export function getPredictedDisease(predictedClass) {
    if (predictedClass === null) {
        return predictedClassNames[0];
    }

    return predictedClassNames[predictedClass + 1];
}