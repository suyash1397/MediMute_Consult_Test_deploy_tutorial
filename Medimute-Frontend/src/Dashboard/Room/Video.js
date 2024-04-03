import React, { useEffect, useRef, useState } from "react";
import { styled } from "@mui/system";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import * as tf from "@tensorflow/tfjs";
import {
  createDetector,
  SupportedModels,
} from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { connect } from "react-redux";
import { sendDiseaseMessages } from "../../realtimeCommunication/socketConnection";
import { updateOnTheRemoteSide } from "../../shared/utils/chat";
import store from "../../store/store";
import { getPredictedDisease } from "../../utils/config";

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm`
);

async function setupDetector() {
  const model = SupportedModels.MediaPipeHands;
  const detector = await createDetector(model, {
    runtime: "mediapipe",
    maxHands: 2,
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
  });

  return detector;
}

async function loadModel() {
  await tf.ready();

  console.log("Hello");
  const model = await tf.loadLayersModel("/model.json"); // Replace with your model path
  return model;
}

function preProcessLandmark(landmarkList) {
  // Deep copy of the landmark list
  let tempLandmarkList = JSON.parse(JSON.stringify(landmarkList));

  // Convert to relative coordinates
  let baseX = 0,
    baseY = 0;
  tempLandmarkList.forEach((landmarkPoint, index) => {
    if (index === 0) {
      baseX = landmarkPoint[0];
      baseY = landmarkPoint[1];
    }

    tempLandmarkList[index][0] = landmarkPoint[0] - baseX;
    tempLandmarkList[index][1] = landmarkPoint[1] - baseY;
  });

  // Convert to a one-dimensional list
  tempLandmarkList = tempLandmarkList.flat();

  // Normalization
  const maxAbsValue = Math.max(...tempLandmarkList);

  const normalize = (n) => n / maxAbsValue;

  tempLandmarkList = tempLandmarkList.map(normalize);
  return tempLandmarkList;
}

const MainContainer = styled("div")({
  height: "50%",
  width: "50%",
  backgroundColor: "black",
  borderRadius: "8px",
});

const VideoEl = styled("video")({
  width: "100%",
  height: "100%",
});

const Video = ({ stream, isLocalStream, isDoctor, chosenChatDetails }) => {
  const [predictedClass, setPredictedClass] = useState(null);
  const [model2, setModel2] = useState(null);
  const videoRef = useRef();
  const detectorRef = useRef(null);

  useEffect(() => {
    console.log({ receiverUserId: chosenChatDetails.id, PredictedClass: null });

    // Call updateOnTheRemoteSide and pass the callback function
    updateOnTheRemoteSide({
      receiverUserId: chosenChatDetails.id,
      PredictedClass: null,
    }); // Pass PredictedClass as null initially
  }, [chosenChatDetails.id]);

  useEffect(() => {
    async function initModel() {
      const loadedModel = await loadModel();

      console.log("loaded model", loadedModel);
      setModel2(loadedModel);
    }
    initModel();

    // listen to predicted class reducer value
    store.subscribe(() => {
      const storeState = store.getState();

      console.log("store: ", storeState.predictedClass);
      if (storeState.predictedClass !== predictedClass) {
        setPredictedClass(storeState.predictedClass);
      }
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
    };
    if (!isDoctor) {
      (async () => {
        detectorRef.current = await setupDetector();
      })();
    }

    const predict = async () => {
      if (!isDoctor && detectorRef.current && model2) {
        const hands = await detectorRef.current.estimateHands(video, {
          flipHorizontal: false,
        });
        if (hands.length > 0) {
          const handKeypoints = hands[0].keypoints;
          const arrayOfArrays = handKeypoints.map(({ x, y }) => [x, y]);
          const sampleInput = preProcessLandmark(arrayOfArrays);

          // Create a TensorFlow tensor from the sample input
          const inputTensor = tf.tensor2d([sampleInput]);
          if (model2) {
            // Use the model for predictions
            const prediction = model2.predict(inputTensor);

            // Convert the TensorFlow tensor to a JavaScript array
            const predictionArray = Array.from(prediction.dataSync());

            // Find the index of the maximum value (predicted class)
            const predictedClassIndex = predictionArray.indexOf(
              Math.max(...predictionArray)
            );

            setPredictedClass(predictedClassIndex); // update on patient side
            // sendDiseaseMessages({ receiverUserId: chosenChatDetails.id, PredictedClass: predictedClassIndex });

            // Print the predicted class
            // console.log('Predicted Class:', predictedClassIndex);

            sendDiseaseMessages({
              receiverUserId: chosenChatDetails.id,
              PredictedClass: predictedClassIndex,
            });
            // console.log(arrayOfArrays);
          } else {
            console.log("Model is null. Prediction cannot be made.");
          }
        } else {
          setPredictedClass(-1);
          sendDiseaseMessages({
            receiverUserId: chosenChatDetails.id,
            PredictedClass: -1,
          });
          console.log("No hands detected");
        }
      }
    };
    let interval = null;
    interval = setInterval(predict, 25);

    return () => {
      clearInterval(interval);
    };
  }, [stream, model2, isDoctor, chosenChatDetails.id]);

  return (
    <MainContainer>
      <VideoEl ref={videoRef} autoPlay muted={isLocalStream ? true : false} />
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#fff",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        result here: {getPredictedDisease(predictedClass)}
      </h1>
    </MainContainer>
  );
};

const mapStoreStateToProps = ({ chat }) => {
  return {
    ...chat,
  };
};

export default connect(mapStoreStateToProps)(Video);
