/*
 * Entry point for the companion app
 */

import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { localStorage } from "local-storage";

let players = JSON.parse(settingsStorage.getItem("players"));
let numGoals = localStorage.length;
const goals = [];

// Send goals and pleyers to app

messaging.peerSocket.onopen = function() {
  for (let i=0; i<numGoals; i++) {
    goals.push(JSON.parse(localStorage.getItem(localStorage.key(i))));
  }
  
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({action: "init", goals, players});
  }
}

// Process messages

messaging.peerSocket.onmessage = function(evt) {
  switch (evt.data.action) {
    case "goal":
      const goal = evt.data.goal;
      localStorage.setItem(`goal-${goal.index}`, JSON.stringify(goal))
      break;
    case "delete-goal":
      numGoals--;
      for (let i=evt.data.index; i<numGoals; i++) {
        let g = JSON.parse(localStorage.getItem(`goal-${i+1}`));
        g.index = i;
        localStorage.setItem(`goal-${i}`, JSON.stringify(g));
      }
      localStorage.removeItem(`goal-${numGoals}`)
      break;
    case "delete-all":
      localStorage.clear();
  }
}

settingsStorage.onchange = function(evt) {
  players = JSON.parse(evt.newValue);
  
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({action: "playersChanged", players});
  }
}