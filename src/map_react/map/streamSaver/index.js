import DataManager from "../dataManager";

window.onload = () => {
  let dataManager = new DataManager();
  dataManager.connectToSockets();
  // dataManager.trialBufferFull = e => {
  //     console.log(e);
  // }
};
// document.getElementById('saveData').onclick = () => writeData;
const writeData = dat => {
  let dataToSend = {};
  dataToSend[`trialCount_${trialCount}`] = {
    inv1: dat[0],
    inv2: dat[1]
  };

  fetch(`/api/PY19N006/data/save`, {
    method: "POST",
    body: JSON.stringify(dataToSend),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(res => res.json())
    .then(response => console.log("Success:", JSON.stringify(response)))
    .catch(error => console.error("Error:", error));
};
