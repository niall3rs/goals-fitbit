/*
 * Entry point for the app
 */

import * as messaging from "messaging";
import document from "document";

const confirmDeleteSingleGoalButton  = document.getElementById("delete-single-goal-confirm");
const cancelDeleteSingleGoalButton   = document.getElementById("delete-single-goal-cancel");
const deleteSingleGoalTitle    = document.getElementById("delete-single-goal-title");
const deleteSingleGoalPopup    = document.getElementById("delete-single-goal-popup");
const confirmDeleteGoalsButton = document.getElementById("delete-goals-confirm");
const cancelDeleteGoalsButton  = document.getElementById("delete-goals-cancel");
const deleteGoalsButton = document.getElementById("delete-goals");
const deleteGoalsPopup  = document.getElementById("delete-goals-popup");
const newGoalButton     = document.getElementById("new-goal");
const loadingPage       = document.getElementById("loading");
const goalsButton       = document.getElementById("goals");
const viewHeader        = document.getElementById("view-header");
const altPlayer         = document.getElementById("player-alt");
const playerList        = document.getElementById("player-list");
const playerItems       = playerList.getElementsByClassName("tile-list-item");
const goalList          = document.getElementById("goal-list");
const goalItems         = goalList.getElementsByClassName("tile-list-item");
const addPlayers        = document.getElementById("add-players");
const maxGoals          = document.getElementById("max-goals");
const noGoals           = document.getElementById("no-goals");

let playerNames;
let numGoals;
let players;
let player;
let goals;
let sortedGoals;
let deleteGoalIndex;
let isHome = true;
let goal   = {};


// Process data from companion

messaging.peerSocket.onmessage = function(evt) {
  switch (evt.data.action) {
    case "init":
      goals = evt.data.goals || [];
      players = evt.data.players;
      numGoals = goals.length
      goal.index = numGoals;
      sortedGoals = goals.sort((a,b) => a.index - b.index);

      for (let i=0; i<numGoals; i++) {
        addGoal(i, sortedGoals[i].scorer, sortedGoals[i].assister)
      }

      if (players) {
        updatePlayers(players);
        showHome();
      }
      break;
    case "playersChanged":
      players = evt.data.players;
      updatePlayers(players);
      break;
  }
}

// New goal

newGoalButton.onactivate = function(evt) {
  hideHome();
  
  if (players.length == 0) {
    addPlayers.style.display = "inline";
  } else if (numGoals == 20) {
    maxGoals.style.display = "inline";
  } else {
    altPlayer.text = "OG";
    viewHeader.style.display = "inline";
    playerList.style.display = "inline";
  }
}

// Set up player click events

playerItems.forEach((element, index) => {
  let touch = element.getElementById("touch-me");
  touch.onclick = (evt) => {
    if (!goal.scorer) {
      player = document.getElementById("player-" + index);
      if (player) player.style.display = "none";
      playerList.value = 0;
      goal.scorer = playerNames[index] || altPlayer.text;
      viewHeader.text = "Assist";
      altPlayer.text = "None";
    } else {
      goal.assister = playerNames[index] || altPlayer.text;
      if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({action: "goal", goal});
        addGoal(goal.index, goal.scorer, goal.assister);
        sortedGoals.push(goals);
        goal.index++;
        numGoals++;
        delete goal.scorer;
        delete goal.assister;
      }
      
      showHome();
    }
  }
});

// Goals

goalsButton.onactivate = function(evt) {
  hideHome();
  if (numGoals > 0) {
    goalList.style.display = "inline";
  } else {
    noGoals.style.display = "inline";
  }
};

// Set up goal click events

goalItems.forEach((element, index) => {
  let touch = element.getElementById("touch-me");
  touch.onclick = (evt) => {
    deleteGoalIndex = index;
    deleteSingleGoalTitle.text = `Delete goal ${index + 1}?`;
    deleteSingleGoalPopup.style.display = "inline";
  }
});

// Confirm delete goal

confirmDeleteSingleGoalButton.onclick = function(evt) {
  deleteGoal(deleteGoalIndex);
  deleteSingleGoalPopup.style.display = "none";
}

// Cancel delete goal

cancelDeleteSingleGoalButton.onclick = function(evt) {
  deleteSingleGoalPopup.style.display = "none";
}

// Clear goals

deleteGoalsButton.onactivate = function(evt) {
  hideHome();
  deleteGoalsPopup.style.display = "inline"
};

// Confirm clear goals

confirmDeleteGoalsButton.onclick = function(evt) {
  showHome();
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({action: "delete-all"});
    clearGoals();
  }
};

// Cancel clear goals

cancelDeleteGoalsButton.onclick = function(evt) {
  showHome();
};

// Hardware buttons

document.onkeypress = function(e) {
  if (!isHome) {
    e.preventDefault();
    switch (e.key) {
      case "up":
        break;
      case "down":
        break;
      case "back":
        showHome();
        delete goal.scorer;
        delete goal.assister;
    }
  }
}

// Utility functions

const showHome = function() {
  isHome = true;
  viewHeader.text = "Goal";
  
  if (player) player.style.display = "inline";
  
  playerList.value = 0;
  goalList.value = 0;
  
  deleteSingleGoalPopup.style.display = "none";
  deleteGoalsPopup.style.display = "none";
  loadingPage.style.display = "none";
  addPlayers.style.display = "none";
  viewHeader.style.display = "none";
  playerList.style.display = "none";
  goalList.style.display = "none";
  maxGoals.style.display = "none";
  noGoals.style.display = "none";
  
  deleteGoalsButton.style.display = "inline";
  newGoalButton.style.display = "inline";
  goalsButton.style.display = "inline";
};

const hideHome = function() {
  isHome = false;
  
  deleteGoalsButton.style.display = "none";
  newGoalButton.style.display = "none";
  goalsButton.style.display = "none";
};

const updatePlayers = function(playerArray) {
  playerNames = playerArray.map((i) => i.name);
  altPlayer.style.display = playerArray.length > 0 ? "inline" : "none";
  
  for (let i=0; i<playerArray.length; i++) {
    let player = document.getElementById("player-" + i);
    player.text = playerArray[i].name;
    player.style.display = "inline";
  }
  
  for (let j=playerArray.length; j<20; j++) {
    let player = document.getElementById("player-" + i);
    player.text = "";
    player.style.display = "none";
  }
  
  playerList.value = 0;
};

const addGoal = function(index, scorer, assister) {
  let goal = document.getElementById("goal-" + index);
  goal.text = `${index + 1}: ${scorer} (${assister})`;
  goal.style.display = "inline";
}

const clearGoals = function() {
  for (const i=0; i<numGoals; i++) {
    let goal = document.getElementById("goal-" + i);
    goal.text = "";
    goal.style.display = "none";
  }
  numGoals = 0;
  goal.index = 0;
}

const deleteGoal = function(index) {
  sortedGoals.splice(index, 1);
  numGoals--;
  for (const i = index; i<sortedGoals.length; i++) {
    sortedGoals[i].index = i;
    addGoal(i, sortedGoals[i].scorer, sortedGoals[i].assister);
  }
  let lastGoal = document.getElementById("goal-" + sortedGoals.length);
  lastGoal.text = "";
  lastGoal.style.display = "none";
  
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send({action: "delete-goal", index});
  }
}