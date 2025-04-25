import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase"; 

function signIn() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("User Signed In:", user.displayName, user.email);
    })
    .catch((error) => {
      console.error("Sign-in error", error.message);
    });
}
