import path from "path";
import {
    loadBrain,
    loadGeometry,
    loadDots
} from "../loaders.js";
import "./cceps.scss";
import "bootstrap";

let loadCCEPData = async () => {
    let subject = 'PY19N008'
    let electrodePair = 'LOF7_LOF8'
    let zScorePath = path.join(`/api/CCEPS/${subject}/${electrodePair}/z-scores`);
    let z_score = await fetch(zScorePath);
    let zscore = await z_score.json()
    let filteredZScores = {};
    Object.keys(zscore).forEach((x, i) => {
        if(zscore[x] != 0){
            filteredZScores[x] = zscore[x]
        }
    })
    let numCols = Math.floor(Math.sqrt(Object.keys(filteredZScores).length))
    let numRows = Math.floor(Object.keys(filteredZScores).length/numCols);
    let remainder = Object.keys(filteredZScores).length-(numCols*numRows)
    let totalPlots = numCols*numRows+remainder

    let stimResultPath = path.join(`/api/CCEPS/${subject}/${electrodePair}/img`);
    let stimImg = await fetch(stimResultPath);
    let CCEP1 = document.getElementById("CCEP1");
    let stimImage = await stimImg.arrayBuffer();
    let base64Flag = "data:image/jpeg;base64,";
    let binary = "";
    let bytes = [].slice.call(new Uint8Array(stimImage));
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    CCEP1.setAttribute("src", base64Flag + window.btoa(binary));

    let chartWidth = CCEP1.offsetWidth;

    console.log(chartWidth/numCols)
    CCEP1.addEventListener('mouseover', (e) => {
        setTimeout(() =>  console.log(e.clientX),500)
    })
    
}
window.onload = () => {

    loadBrain('PY19N008');
    loadCCEPData();

}