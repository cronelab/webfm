import path from "path";
import { loadBrain, loadGeometry, loadDots } from "../loaders.js";

let loadCortstim = () => {
    let listPath = path.join('/api/cortstim');
    let csList = document.getElementById('cortStimList')
    fetch(listPath)
        .then(res => {
            return res.json()
        })
        .then(results => {
            results.map(x => {
                let csElement = document.createElement('li')
                csList.appendChild(csElement)
                csElement.innerHTML = x.electrodePair
                console.log(x)
            })

        })
}
window.onload = () => {
    var ctx = document.getElementById('electrode-dots').getContext('2d');

    loadCortstim();
    loadDots();
    loadBrain('PY18N007');
    loadGeometry('PY18N007').then(x=>{
        Object.keys(x).map((ch, i) => {
            if(ch=='ENCL5'){
            console.log(Object.values(x)[i].u)
            console.log(Object.values(x)[i+1])
            // ctx.beginPath();
            // ctx.moveTo(Object.values(x)[i].u*1244, Object.values(x)[i].v*1532);
            // ctx.lineTo(Object.values(x)[i+1].u*1244, Object.values(x)[i+1].v*1532);
            // ctx.strokeStyle = "#FF0000";
            // ctx.stroke();
        }

        })
});
}