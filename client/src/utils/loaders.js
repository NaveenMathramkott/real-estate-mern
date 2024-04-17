import { defer } from "react-router-dom";
import apiCall from "./api";

const singlePageLoader = async ({ request, params }) => {
  const res = await apiCall("/posts/" + params.id);
  return res.data;
};

const listPageLoader = async ({ request, params }) => {
  const query = request.url.split("?")[1];
  const postPromise = apiCall("/posts?" + query);
  return defer({
    postResponse: postPromise,
  });
};

const profilePageLoader = async () => {
  const postPromise = apiCall("/users/profilePosts");
  //   const chatPromise = apiCall("/chats");
  return defer({
    postResponse: postPromise,
    // chatResponse: chatPromise,
  });
};

export { singlePageLoader, listPageLoader, profilePageLoader };
