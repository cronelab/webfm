import path from "path";
import {
    loadBrain,
    loadGeometry,
    loadDots
} from "../loaders.js";
import "./cceps.scss";
import "bootstrap";
let subject;
let ctx;
let brain;
let dots;
let dotObj;
import * as tS from '../../migration/timeSeries'
let loadCCEPData = async () => {
    let task = localStorage.getItem("task");
    let geo = JSON.parse(localStorage.getItem("geometry"));
    let electrodePair = `${task.split('_')[1]}_${task.split('_')[2]}`
    let z_score = await fetch(path.join(`/api/CCEPS/${subject}/${electrodePair}/z-scores`));
    let zscore = await z_score.json()
    let filteredZScores = {};
    Object.keys(zscore).forEach(x => {
        if (zscore[x] != 0) {
            filteredZScores[x] = zscore[x]
        }
    })
    let scale = Math.max(...Object.values(zscore))
    let dotObject = Object.values(zscore).map(x => x / scale);
    let sortedZScores = Object.keys(filteredZScores).sort((a, b) => filteredZScores[b] - filteredZScores[a])

    dotObj = {
        geo,
        dotObject
    }
    loadDots(dotObj)

    let numCols = Math.floor(Math.sqrt(Object.keys(filteredZScores).length))
    let numRows = Math.ceil(Object.keys(filteredZScores).length / numCols);
    let stimResultPath = path.join(`/api/CCEPS/${subject}/${electrodePair}/img`);
    let stimImg = await fetch(stimResultPath);
    let CCEP1 = document.getElementById("CCEP1");
    let stimImage = await stimImg.arrayBuffer();
    let base64Flag = "data:image/jpeg;base64,";
    let binary = "";
    let bytes = [].slice.call(new Uint8Array(stimImage));
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    CCEP1.setAttribute("src", base64Flag + window.btoa(binary));

    let zCanvasContainer = document.getElementById("zscoreCanvas");
    zCanvasContainer.style.position = "absolute";
    zCanvasContainer.width = CCEP1.width;
    zCanvasContainer.height = CCEP1.height;

    let chartWidth = CCEP1.offsetWidth;
    dots = document.getElementById("electrode-dots");
    ctx = dots.getContext("2d");
    brain = document.getElementsByClassName("fm-brain-2D")[0]

    let xPos = [...Array(numCols + 1)].map((x, i) => 70 + (660 / numCols) * i)
    let yPos = [...Array(numRows + 1)].map((y, i) => 20 + (360 / numRows) * i)
    await new Promise(resolve => setTimeout(resolve, 200));

    zCanvasContainer.addEventListener('click', (e) => {
        console.log(
            "A"
        )
        let xTrue = xPos.map((x, i) => {
            if (e.clientX < x) return i
            else return numCols + 1
        })
        let yTrue = yPos.map((y, i) => {
            if (e.clientY < y) return i
            else return numRows + 1
        })
        let graphIndex = Math.min(...xTrue) + (numCols * (Math.min(...yTrue) - 1))
        haloMaker(geo[sortedZScores[graphIndex - 1]].u, geo[sortedZScores[graphIndex - 1]].v, Object.values(zscore)[Object.keys(geo).indexOf(sortedZScores[graphIndex - 1])] / 2)
    })
}

const haloMaker = (elecX, elecY, val) => {
    ctx.clearRect(0, 0, dots.width, dots.height)
    loadDots(dotObj)
    ctx.beginPath();
    ctx.arc(
        brain.width * elecX,
        brain.height * (1 - elecY),
        Math.abs(val),
        0,
        Math.PI * 2,
        true
    );
    ctx.stroke();
    ctx.fillStyle = 'red';
    ctx.fill();
}
window.onload = async () => {
    subject = localStorage.getItem("subject");

    loadBrain(subject);
    loadGeometry(subject).then(() => {

        loadCCEPData();
    })
    let responseInfo = await fetch(path.join(`/responseInfo/${subject}/LCNM01_LCNM02`));
    let resInfo = await responseInfo.json()
    tS.generateChart(resInfo)

}