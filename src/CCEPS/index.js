import "bootstrap";
import "./index.scss";
window.onload = async e => {
    let subject = localStorage.getItem("subject")
    let record = localStorage.getItem("CCEP_Record")
    let base64Flag = "data:image/jpeg;base64,";
    let binary = "";
    let binary2 = "";

    let response = await fetch(`/api/${subject}/CCEPS_response/${record}`)
    let responseMap = await response.arrayBuffer();
    let bytes = [].slice.call(new Uint8Array(responseMap));
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    responseMap = base64Flag + window.btoa(binary);
    document.getElementById("responseMap").src = responseMap;

    let response2 = await fetch(`/api/${subject}/CCEPS_map/${record}`)
    let responseMap2 = await response2.arrayBuffer();
    let bytes2 = [].slice.call(new Uint8Array(responseMap2));
    bytes2.forEach(b => (binary2 += String.fromCharCode(b)));
    responseMap2 = base64Flag + window.btoa(binary2);
    document.getElementById("Map").src = responseMap2;
}