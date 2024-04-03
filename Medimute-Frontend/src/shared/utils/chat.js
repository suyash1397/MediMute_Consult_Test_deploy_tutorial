import store from "../../store/store";
import { setMessages } from "../../store/actions/chatActions";
let userID;

export const updateDirectChatHistoryIfActive = (data) => {
  const { participants, messages } = data;

  // find id of user from token and id from active conversation
  const receiverId = store.getState().chat.chosenChatDetails?.id;
  const userId = store.getState().auth.userDetails._id;

  if (receiverId && userId) {
    const usersInCoversation = [receiverId, userId];

    updateChatHistoryIfSameConversationActive({
      participants,
      usersInCoversation,
      messages,
    });
  }
};

const updateChatHistoryIfSameConversationActive = ({
  participants,
  usersInCoversation,
  messages,
}) => {
  const result = participants.every(function (participantId) {
    return usersInCoversation.includes(participantId);
  });

  if (result) {
    store.dispatch(setMessages(messages));
  }
};



export const updateOnTheRemoteSide = (data, callback) => {
  try {
      // Get the user ID from local storage
      const userString = localStorage.getItem("user");
      
      // Parse the user object from the stored string
      const user = JSON.parse(userString);

      // Check if user exists and has _id property
      if (user && user._id) {
          userID = user._id;
      } else {
          console.log("User ID is not available in local storage");
      }

      // Check if the receiverUserId from data matches with the user ID from local storage
      if (userID === data.receiverUserId) {
          console.log("Predicted Class NG11:", data.PredictedClass);

          store.dispatch({type: "set", updatedPredictedClass: data.PredictedClass});
      }
  } catch (error) {
      console.log("Error in updateOnTheRemoteSide:", error.message);
  }
};
